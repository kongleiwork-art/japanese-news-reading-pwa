import { ARTICLES_CACHE_TTL_MS, VISIBLE_ARTICLE_LIMIT } from "./config.ts";
import {
  getPersistedArticleDetail,
  listPersistedArticles,
} from "../db/articles.ts";
import {
  getEasyCookieCacheState,
  loadEasyArticles,
  loadNewsWebArticleById,
  loadNewsWebArticles,
} from "./sources.ts";
import { selectLearningArticles } from "./selection.ts";
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
  error?: string | null;
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
        error: result.error,
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

async function getNormalizedArticles(filters?: {
  channel?: ArticleChannel;
}) {
  const persistedArticles = await tryListPersistedArticles({ channel: filters?.channel });
  if (persistedArticles && persistedArticles.length > 0) {
    return persistedArticles;
  }

  const requestedChannels = filters?.channel
    ? [filters.channel]
    : (["easy", "original"] as const);
  const articlesByChannel = await Promise.all(
    requestedChannels.map((channel) =>
      channel === "easy"
        ? getSourceArticles("easy", loadEasyArticles)
        : getSourceArticles("original", loadNewsWebArticles),
    ),
  );

  return articlesByChannel.flatMap((articles, index) =>
    selectLearningArticles(articles, { channel: requestedChannels[index] }),
  );
}

function inferArticleChannel(articleId: string): ArticleChannel | undefined {
  if (/^ne\d+$/i.test(articleId)) return "easy";
  if (/^na-k\d+$/i.test(articleId) || /^\d+$/.test(articleId)) return "original";
  return undefined;
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
    image: article.image,
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
  batch?: number;
}) {
  const articles = await getNormalizedArticles({ channel: filters?.channel });
  return getVisibleArticles(articles.filter((article) => matchesFilters(article, filters)), filters?.batch).map(
    toScreenPreview,
  );
}

export async function getArticleDetail(articleId: string) {
  const article = await findArticleById(articleId);

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
  batch?: number;
}) {
  const articles = await getNormalizedArticles({ channel: filters?.channel });
  return getVisibleArticles(
    articles.filter((article) => matchesFilters(article, filters)),
    filters?.batch,
  ).map(toStandardizedPreview);
}

export async function getStandardizedArticleDetail(articleId: string) {
  const article = await findArticleById(articleId);
  return article ? toStandardizedDetail(article) : null;
}

async function findArticleById(articleId: string) {
  const persistedArticle = await tryGetPersistedArticleDetail(articleId);
  if (persistedArticle) {
    return persistedArticle;
  }

  const channel = inferArticleChannel(articleId);
  const articles = await getNormalizedArticles({ channel });
  const article = articles.find((item) => item.id === articleId);

  if (article || channel !== "original") {
    return article ?? null;
  }

  return loadNewsWebArticleById(articleId).catch(() => null);
}

async function tryListPersistedArticles(filters?: {
  channel?: ArticleChannel;
}) {
  try {
    return await listPersistedArticles(filters);
  } catch {
    return null;
  }
}

function getVisibleArticles(articles: NormalizedArticle[], batch = 0) {
  if (articles.length <= VISIBLE_ARTICLE_LIMIT) {
    return articles;
  }

  const batchIndex = Number.isFinite(batch) && batch > 0 ? Math.floor(batch) : 0;
  const start = (batchIndex * VISIBLE_ARTICLE_LIMIT) % articles.length;
  const rotated = [...articles.slice(start), ...articles.slice(0, start)];

  return rotated.slice(0, VISIBLE_ARTICLE_LIMIT);
}

async function tryGetPersistedArticleDetail(articleId: string) {
  try {
    return await getPersistedArticleDetail(articleId);
  } catch {
    return null;
  }
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
