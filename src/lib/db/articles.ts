import type { InArgs } from "@libsql/client";

import { getArticleDbClient } from "./client.ts";
import { ARTICLE_SCHEMA_STATEMENTS } from "./schema.ts";
import { dedupeVocabularyItems } from "../articles/vocabulary.ts";
import {
  articleCategories,
  articleChannels,
  type ArticleCategory,
  type ArticleChannel,
  type ArticleImage,
  type ConcreteArticleCategory,
  type NormalizedArticle,
  type VocabularyItem,
} from "../articles/types.ts";

type ArticleRow = {
  id: string;
  channel: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  published_at_iso: string;
  published_at: string;
  image_type: string;
  image_value: string;
  image_alt: string;
  image_style: string;
  reading_minutes: number;
  tag_label: string;
  content?: string;
  vocabulary_ids: string;
  vocabulary_data: string;
};

export async function initializeArticleDatabase() {
  const client = getArticleDbClient();
  if (!client) return false;

  for (const sql of ARTICLE_SCHEMA_STATEMENTS) {
    await client.execute(sql);
  }

  return true;
}

export async function listPersistedArticles(filters?: {
  channel?: ArticleChannel;
  category?: ArticleCategory;
}) {
  const client = getArticleDbClient();
  if (!client) return null;

  const rows = await selectDailyArticleRows(filters?.channel);
  return rows
    .map(rowToArticle)
    .filter((article) => matchesCategory(article, filters?.category));
}

export async function getPersistedArticleDetail(articleId: string) {
  const client = getArticleDbClient();
  if (!client) return null;

  const result = await client.execute({
    sql: `SELECT * FROM article_content WHERE id = ? LIMIT 1`,
    args: [articleId],
  });
  const row = result.rows[0] as unknown as ArticleRow | undefined;

  return row ? rowToArticle(row) : null;
}

export async function saveSelectedArticles(articles: NormalizedArticle[]) {
  const client = getArticleDbClient();
  if (!client) return false;
  if (articles.length === 0) return true;

  const channels = [...new Set(articles.map((article) => article.channel))];
  const statements: { sql: string; args: InArgs }[] = [];

  for (const article of articles) {
    statements.push({
      sql: `INSERT INTO article_content (
        id, channel, title, summary, category, source, published_at_iso, published_at,
        image_type, image_value, image_alt, image_style, reading_minutes, tag_label,
        content, vocabulary_ids, vocabulary_data, fetched_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        channel = excluded.channel,
        title = excluded.title,
        summary = excluded.summary,
        category = excluded.category,
        source = excluded.source,
        published_at_iso = excluded.published_at_iso,
        published_at = excluded.published_at,
        image_type = excluded.image_type,
        image_value = excluded.image_value,
        image_alt = excluded.image_alt,
        image_style = excluded.image_style,
        reading_minutes = excluded.reading_minutes,
        tag_label = excluded.tag_label,
        content = excluded.content,
        vocabulary_ids = excluded.vocabulary_ids,
        vocabulary_data = excluded.vocabulary_data,
        fetched_at = CURRENT_TIMESTAMP`,
      args: articleContentArgs(article),
    });
  }

  for (const channel of channels) {
    statements.push({
      sql: `DELETE FROM daily_articles WHERE channel = ?`,
      args: [channel],
    });
  }

  for (const [rank, article] of articles.entries()) {
    statements.push({
      sql: `INSERT INTO daily_articles (
        id, channel, title, summary, category, source, published_at_iso, published_at,
        image_type, image_value, image_alt, image_style, reading_minutes, tag_label,
        vocabulary_ids, vocabulary_data, selected_rank, selected_at, fetched_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: dailyArticleArgs(article, rank),
    });
  }

  await client.batch(statements, "write");
  return true;
}

async function selectDailyArticleRows(channel?: ArticleChannel) {
  const client = getArticleDbClient();
  if (!client) return [];

  const result = channel
    ? await client.execute({
        sql: `SELECT article_content.*
          FROM daily_articles
          JOIN article_content ON article_content.id = daily_articles.id
          WHERE daily_articles.channel = ?
          ORDER BY daily_articles.selected_rank ASC`,
        args: [channel],
      })
    : await client.execute(`SELECT article_content.*
        FROM daily_articles
        JOIN article_content ON article_content.id = daily_articles.id
        ORDER BY daily_articles.channel ASC, daily_articles.selected_rank ASC`);

  return result.rows as unknown as ArticleRow[];
}

function articleContentArgs(article: NormalizedArticle): InArgs {
  return [
    article.id,
    article.channel,
    article.title,
    article.summary,
    article.category,
    article.source,
    article.publishedAtIso,
    article.publishedAt,
    article.image.type,
    article.image.value,
    article.image.alt,
    article.imageStyle,
    article.readingMinutes,
    article.tagLabel,
    JSON.stringify(article.content),
    JSON.stringify(article.vocabularyIds),
    JSON.stringify(article.savedWords),
  ];
}

function dailyArticleArgs(article: NormalizedArticle, rank: number): InArgs {
  return [
    article.id,
    article.channel,
    article.title,
    article.summary,
    article.category,
    article.source,
    article.publishedAtIso,
    article.publishedAt,
    article.image.type,
    article.image.value,
    article.image.alt,
    article.imageStyle,
    article.readingMinutes,
    article.tagLabel,
    JSON.stringify(article.vocabularyIds),
    JSON.stringify(article.savedWords),
    rank,
  ];
}

function rowToArticle(row: ArticleRow): NormalizedArticle {
  const channel = articleChannels.includes(row.channel as ArticleChannel)
    ? (row.channel as ArticleChannel)
    : "easy";
  const image: ArticleImage = {
    type: row.image_type === "remote" ? "remote" : "gradient",
    value: row.image_value,
    alt: row.image_alt,
  };
  const savedWords = dedupeVocabularyItems(parseJsonArray<VocabularyItem>(row.vocabulary_data, []));

  return {
    id: row.id,
    channel,
    title: row.title,
    source: row.source,
    category: row.category as ConcreteArticleCategory,
    summary: row.summary,
    readingMinutes: Number(row.reading_minutes) || 1,
    publishedAt: row.published_at,
    publishedAtIso: row.published_at_iso,
    image,
    imageStyle: row.image_style,
    tagLabel: row.tag_label,
    content: parseJsonArray<string>(row.content, []),
    vocabularyIds: savedWords.map((word) => word.id),
    savedWords,
  };
}

function matchesCategory(article: NormalizedArticle, category?: ArticleCategory) {
  return !category || category === articleCategories[0] || article.category === category;
}

function parseJsonArray<T>(value: string | undefined, fallback: T[]) {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}
