import { ARTICLES_CACHE_TTL_MS } from "./config.ts";
import { getEasyCookieCacheState, loadEasyArticles, loadNewsWebArticles } from "./sources.ts";
import {
  articleCategories,
  type ArticleCategory,
  type ArticleChannel,
  type ArticleDetail,
  type ArticleSourceHealth,
  type NormalizedArticle,
  type StandardizedArticleDetail,
  type StandardizedArticlePreview,
} from "./types.ts";

type SourceLoadResult = {
  articles: NormalizedArticle[];
  failedItems: number;
};

type SourceCache = {
  expiresAt: number;
  promise: Promise<NormalizedArticle[]> | null;
  value: NormalizedArticle[] | null;
};

const sourceCaches: Record<ArticleChannel, SourceCache> = {
  easy: { expiresAt: 0, promise: null, value: null },
  original: { expiresAt: 0, promise: null, value: null },
};

const sourceHealth: Record<ArticleChannel, ArticleSourceHealth> = {
  easy: createInitialHealth("easy"),
  original: createInitialHealth("original"),
};

function createInitialHealth(source: ArticleChannel): ArticleSourceHealth {
  return {
    source,
    status: "idle",
    itemCount: 0,
    lastStartedAt: null,
    lastFinishedAt: null,
    lastSuccessfulAt: null,
    cacheExpiresAt: null,
    error: null,
  };
}

function now() {
  return Date.now();
}

function toIsoOrNull(value: number) {
  return value > now() ? new Date(value).toISOString() : null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function beginSourceLoad(source: ArticleChannel) {
  sourceHealth[source] = {
    ...sourceHealth[source],
    status: "loading",
    lastStartedAt: new Date().toISOString(),
    error: null,
  };
}

function finishSourceLoad(
  source: ArticleChannel,
  result: {
    itemCount: number;
    failedItems: number;
    cacheExpiresAt: number;
    error?: string | null;
  },
) {
  const finishedAt = new Date().toISOString();
  const hasItems = result.itemCount > 0;
  const status = result.error
    ? hasItems
      ? "degraded"
      : "failed"
    : result.failedItems > 0
      ? "degraded"
      : hasItems
        ? "ready"
        : "degraded";

  sourceHealth[source] = {
    source,
    status,
    itemCount: result.itemCount,
    lastStartedAt: sourceHealth[source].lastStartedAt,
    lastFinishedAt: finishedAt,
    lastSuccessfulAt: result.error ? sourceHealth[source].lastSuccessfulAt : finishedAt,
    cacheExpiresAt: toIsoOrNull(result.cacheExpiresAt),
    error: result.error ?? (result.failedItems > 0 ? `${result.failedItems} articles failed` : null),
  };
}

async function getSourceArticles(
  source: ArticleChannel,
  loader: () => Promise<SourceLoadResult>,
) {
  const cache = sourceCaches[source];

  if (cache.value && cache.expiresAt > now()) {
    return cache.value;
  }

  if (cache.promise && cache.expiresAt > now()) {
    return cache.promise;
  }

  beginSourceLoad(source);
  const expiresAt = now() + ARTICLES_CACHE_TTL_MS;
  const promise = loader()
    .then((result) => {
      cache.expiresAt = expiresAt;
      cache.value = result.articles;
      cache.promise = null;
      finishSourceLoad(source, {
        itemCount: result.articles.length,
        failedItems: result.failedItems,
        cacheExpiresAt: expiresAt,
      });
      return result.articles;
    })
    .catch((error: unknown) => {
      cache.promise = null;
      const fallback = cache.value ?? [];
      finishSourceLoad(source, {
        itemCount: fallback.length,
        failedItems: 0,
        cacheExpiresAt: cache.expiresAt,
        error: getErrorMessage(error),
      });
      return fallback;
    });

  cache.expiresAt = expiresAt;
  cache.promise = promise;
  return promise;
}

async function getNormalizedArticles() {
  const [easyArticles, newsWebArticles] = await Promise.all([
    getSourceArticles("easy", loadEasyArticles),
    getSourceArticles("original", loadNewsWebArticles),
  ]);

  return [...easyArticles, ...newsWebArticles].sort(
    (left, right) =>
      new Date(right.publishedAtIso).getTime() - new Date(left.publishedAtIso).getTime(),
  );
}

function matchesFilters(
  article: NormalizedArticle,
  filters?: {
    channel?: ArticleChannel;
    category?: ArticleCategory;
  },
) {
  if (filters?.channel && article.channel !== filters.channel) {
    return false;
  }

  if (
    filters?.category &&
    filters.category !== articleCategories[0] &&
    article.category !== filters.category
  ) {
    return false;
  }

  return true;
}

function toScreenPreview(article: NormalizedArticle) {
  return {
    id: article.id,
    channel: article.channel,
    title: article.title,
    source: article.source,
    category: article.category,
    summary: article.summary,
    readingMinutes: article.readingMinutes,
    publishedAt: article.publishedAt,
    imageStyle: article.imageStyle,
  };
}

function toStandardizedPreview(article: NormalizedArticle): StandardizedArticlePreview {
  return {
    id: article.id,
    channel: article.channel,
    title: article.title,
    source: article.source,
    category: article.category,
    summary: article.summary,
    readingMinutes: article.readingMinutes,
    publishedAt: article.publishedAt,
    image: article.image,
  };
}

function toStandardizedDetail(article: NormalizedArticle): StandardizedArticleDetail {
  return {
    ...toStandardizedPreview(article),
    content: article.content,
    vocabularyIds: article.vocabularyIds,
  };
}

export async function listArticlePreviews(filters?: {
  channel?: ArticleChannel;
  category?: ArticleCategory;
}) {
  const articles = await getNormalizedArticles();
  return articles.filter((article) => matchesFilters(article, filters)).map(toScreenPreview);
}

export async function getArticleDetail(articleId: string) {
  const articles = await getNormalizedArticles();
  const article = articles.find((item) => item.id === articleId);

  if (!article) {
    return null;
  }

  return {
    ...toScreenPreview(article),
    tagLabel: article.tagLabel,
    content: article.content,
    savedWords: article.savedWords,
  } satisfies ArticleDetail;
}

export async function listStandardizedArticles(filters?: {
  channel?: ArticleChannel;
  category?: ArticleCategory;
}) {
  const articles = await getNormalizedArticles();
  return articles
    .filter((article) => matchesFilters(article, filters))
    .map(toStandardizedPreview);
}

export async function getStandardizedArticleDetail(articleId: string) {
  const articles = await getNormalizedArticles();
  const article = articles.find((item) => item.id === articleId);
  return article ? toStandardizedDetail(article) : null;
}

export function getArticlePipelineHealth() {
  return {
    generatedAt: new Date().toISOString(),
    cacheTtlMs: ARTICLES_CACHE_TTL_MS,
    easyAuthCookie: getEasyCookieCacheState(),
    sources: {
      easy: sourceHealth.easy,
      original: sourceHealth.original,
    },
  };
}
