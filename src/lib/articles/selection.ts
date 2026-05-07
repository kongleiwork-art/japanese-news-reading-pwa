import { READABLE_POOL_LIMIT } from "./config.ts";
import type { ArticleChannel, ConcreteArticleCategory, NormalizedArticle } from "./types.ts";

type ScoredArticle = {
  article: NormalizedArticle;
  score: number;
};

const categorySoftLimit = 4;

export function selectLearningArticles(
  articles: NormalizedArticle[],
  options: {
    limit?: number;
    channel?: ArticleChannel;
  } = {},
) {
  const limit = options.limit ?? READABLE_POOL_LIMIT;
  const uniqueArticles = dedupeArticles(
    options.channel ? articles.filter((article) => article.channel === options.channel) : articles,
  );
  const primaryPool = scoreArticles(uniqueArticles, 3);
  const fallbackPool = scoreArticles(uniqueArticles, 2);
  const pool = primaryPool.length >= limit ? primaryPool : mergeScoredArticles(primaryPool, fallbackPool);

  return pickDiverseArticles(pool, limit);
}

function scoreArticles(articles: NormalizedArticle[], minVocabularyCount: number) {
  return articles
    .filter((article) => isEligibleArticle(article, minVocabularyCount))
    .map((article) => ({
      article,
      score: calculateLearningScore(article),
    }))
    .sort((left, right) => {
      const scoreDelta = right.score - left.score;
      if (scoreDelta !== 0) return scoreDelta;

      return (
        new Date(right.article.publishedAtIso).getTime() -
        new Date(left.article.publishedAtIso).getTime()
      );
    });
}

function isEligibleArticle(article: NormalizedArticle, minVocabularyCount: number) {
  if (!article.id || !article.title.trim() || !article.summary.trim()) return false;
  if (!Array.isArray(article.content) || article.content.length === 0) return false;

  const textLength = getContentLength(article);
  const length = getLengthTargets(article.channel);
  if (textLength < length.min) return false;
  if (textLength > length.max * 1.6) return false;

  return article.vocabularyIds.length >= minVocabularyCount;
}

/**
 * Scores a parsed article for study value, balancing readable length,
 * vocabulary coverage, difficulty, freshness, and topic heaviness.
 */
function calculateLearningScore(article: NormalizedArticle) {
  const textLength = getContentLength(article);
  const length = getLengthTargets(article.channel);
  const vocabularyCount = article.vocabularyIds.length;
  const difficultWordCount = article.savedWords.filter(
    (word) => word.level === "N1" || word.level === "N2",
  ).length;
  const intermediateWordCount = article.savedWords.filter(
    (word) => word.level === "N3" || word.level === "N4",
  ).length;

  let score = 0;
  score += scoreLength(textLength, length.idealMin, length.idealMax) * 35;
  score += Math.min(vocabularyCount, 12) * 4;
  score += Math.min(intermediateWordCount, 8) * 3;
  score -= difficultWordCount * 3;
  score += scoreFreshness(article.publishedAtIso) * 12;
  score -= scoreHeavyTopicPenalty(article);

  return score;
}

function pickDiverseArticles(pool: ScoredArticle[], limit: number) {
  const selected: NormalizedArticle[] = [];
  const categoryCounts = new Map<ConcreteArticleCategory, number>();

  for (const item of pool) {
    const count = categoryCounts.get(item.article.category) ?? 0;
    if (count >= categorySoftLimit && pool.length - selected.length > limit) {
      continue;
    }

    selected.push(item.article);
    categoryCounts.set(item.article.category, count + 1);

    if (selected.length >= limit) {
      return selected;
    }
  }

  for (const item of pool) {
    if (selected.some((article) => article.id === item.article.id)) continue;
    selected.push(item.article);
    if (selected.length >= limit) break;
  }

  return selected;
}

function dedupeArticles(articles: NormalizedArticle[]) {
  const seen = new Set<string>();
  const unique: NormalizedArticle[] = [];

  for (const article of articles) {
    const key = `${article.channel}:${article.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(article);
  }

  return unique;
}

function mergeScoredArticles(primary: ScoredArticle[], fallback: ScoredArticle[]) {
  const byId = new Map(primary.map((item) => [`${item.article.channel}:${item.article.id}`, item]));

  for (const item of fallback) {
    const key = `${item.article.channel}:${item.article.id}`;
    if (!byId.has(key)) {
      byId.set(key, item);
    }
  }

  return [...byId.values()].sort((left, right) => right.score - left.score);
}

function getContentLength(article: NormalizedArticle) {
  return article.content.join("").trim().length;
}

function getLengthTargets(channel: ArticleChannel) {
  return channel === "easy"
    ? { min: 120, idealMin: 220, idealMax: 650, max: 900 }
    : { min: 250, idealMin: 450, idealMax: 1200, max: 1800 };
}

function scoreLength(length: number, idealMin: number, idealMax: number) {
  if (length >= idealMin && length <= idealMax) return 1;
  if (length < idealMin) return Math.max(0, length / idealMin);

  return Math.max(0, 1 - (length - idealMax) / idealMax);
}

function scoreFreshness(publishedAtIso: string) {
  const ageHours = (Date.now() - Date.parse(publishedAtIso)) / (60 * 60 * 1000);
  if (!Number.isFinite(ageHours) || ageHours < 0) return 0.5;
  if (ageHours <= 24) return 1;
  if (ageHours <= 72) return 0.7;
  if (ageHours <= 168) return 0.4;
  return 0.15;
}

function scoreHeavyTopicPenalty(article: NormalizedArticle) {
  const text = [article.title, article.summary, ...article.content].join("\n");
  const heavyTerms = ["死亡", "殺害", "逮捕", "事故", "火災", "地震", "津波", "戦争", "攻撃"];
  return heavyTerms.filter((term) => text.includes(term)).length * 5;
}
