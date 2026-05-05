import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { ArticleChannel, NormalizedArticle } from "./types.ts";

type SourceCacheRow = {
  articles_json: string;
};

type ArticleCacheRow = {
  article_json: string;
};

let database: DatabaseSync | null = null;

function getCachePath() {
  return process.env.ARTICLES_SQLITE_CACHE_PATH ?? join(process.cwd(), ".cache", "articles.sqlite");
}

function getDatabase() {
  if (database) {
    return database;
  }

  const cachePath = getCachePath();
  mkdirSync(dirname(cachePath), { recursive: true });

  database = new DatabaseSync(cachePath);
  database.exec(`
    CREATE TABLE IF NOT EXISTS article_source_cache (
      source TEXT PRIMARY KEY,
      articles_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS article_detail_cache (
      source TEXT NOT NULL,
      id TEXT NOT NULL,
      article_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (source, id)
    );
  `);

  return database;
}

function parseArticles(value: string) {
  const parsed = JSON.parse(value);
  return Array.isArray(parsed) ? (parsed as NormalizedArticle[]) : [];
}

export function saveSourceArticlesToCache(source: ArticleChannel, articles: NormalizedArticle[]) {
  if (articles.length === 0) {
    return;
  }

  const db = getDatabase();
  const now = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO article_source_cache (source, articles_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(source) DO UPDATE SET
        articles_json = excluded.articles_json,
        updated_at = excluded.updated_at
    `,
  ).run(source, JSON.stringify(articles), now);

  const detailStatement = db.prepare(
    `
      INSERT INTO article_detail_cache (source, id, article_json, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(source, id) DO UPDATE SET
        article_json = excluded.article_json,
        updated_at = excluded.updated_at
    `,
  );

  for (const article of articles) {
    detailStatement.run(source, article.id, JSON.stringify(article), now);
  }
}

export function loadSourceArticlesFromCache(source: ArticleChannel) {
  const row = getDatabase()
    .prepare("SELECT articles_json FROM article_source_cache WHERE source = ?")
    .get(source) as SourceCacheRow | undefined;

  return row ? parseArticles(row.articles_json) : [];
}

export function saveArticleToCache(source: ArticleChannel, article: NormalizedArticle) {
  const now = new Date().toISOString();

  getDatabase()
    .prepare(
      `
        INSERT INTO article_detail_cache (source, id, article_json, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(source, id) DO UPDATE SET
          article_json = excluded.article_json,
          updated_at = excluded.updated_at
      `,
    )
    .run(source, article.id, JSON.stringify(article), now);
}

export function loadArticleFromCache(source: ArticleChannel, articleId: string) {
  const row = getDatabase()
    .prepare("SELECT article_json FROM article_detail_cache WHERE source = ? AND id = ?")
    .get(source, articleId) as ArticleCacheRow | undefined;

  return row ? (JSON.parse(row.article_json) as NormalizedArticle) : null;
}
