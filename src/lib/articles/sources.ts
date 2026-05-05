import {
  EASY_ARTICLE_LIMIT,
  EASY_AUTH_COOKIE_TTL_MS,
  NHK_EASY_AUTHORIZATION_URL,
  NHK_EASY_DEFAULT_AREA,
  NHK_EASY_SITEMAP_URL,
  NHK_NEWS_WEB_ARTICLE_API_BASE,
  NHK_NEWS_WEB_ARTICLE_URL_BASE,
  NHK_NEWS_WEB_SITEMAP_URL,
  ORIGINAL_ARTICLE_LIMIT,
  USER_AGENT,
  type EasyConsentArea,
} from "./config.ts";
import {
  loadArticleFromCache,
  loadSourceArticlesFromCache,
  saveArticleToCache,
  saveSourceArticlesToCache,
} from "./cache.ts";
import {
  extractEasyArticleData,
  extractNewsWebOriginalArticleData,
  extractNewsWebOriginalArticleId,
  isEasyArticleUrl,
  isNewsWebOriginalArticleUrl,
  parseSitemapEntries,
} from "./parsers.ts";
import type { NormalizedArticle } from "./types.ts";
import {
  buildImageStyle,
  fetchText,
  formatPublishedAt,
  getSetCookieHeaders,
  guessCategoryFromText,
  mergeCookieJar,
  serializeCookieJar,
} from "./utils.ts";
import { chooseVocabularyItems } from "./vocabulary.ts";

type SourceLoadResult = {
  articles: NormalizedArticle[];
  failedItems: number;
  error?: string | null;
};

type CookieCache = {
  expiresAt: number;
  promise: Promise<string>;
  value?: string;
  error?: string;
};

let easyAuthorizedCookieCache: CookieCache | null = null;

function now() {
  return Date.now();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function buildEasyConsentCookieValue(area: EasyConsentArea = NHK_EASY_DEFAULT_AREA) {
  return encodeURIComponent(
    JSON.stringify({
      status: "optedin",
      entity: "household",
      area,
    }),
  );
}

async function createEasyAuthorizedCookieHeader(redirectUrl: string) {
  const cookieJar = new Map<string, string>();
  cookieJar.set("consentToUse", buildEasyConsentCookieValue());

  let currentUrl =
    `${NHK_EASY_AUTHORIZATION_URL}?idp=r-alaz&profileType=anonymous` +
    `&redirect_uri=${encodeURIComponent(redirectUrl)}&ctu=in`;

  for (let redirectCount = 0; redirectCount < 10; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      cache: "no-store",
      redirect: "manual",
      headers: {
        "user-agent": USER_AGENT,
        cookie: serializeCookieJar(cookieJar),
      },
    });

    mergeCookieJar(cookieJar, getSetCookieHeaders(response));

    if (response.status < 300 || response.status >= 400) {
      break;
    }

    const location = response.headers.get("location");
    if (!location) {
      break;
    }

    currentUrl = new URL(location, currentUrl).toString();
  }

  return serializeCookieJar(cookieJar);
}

export async function getEasyAuthorizedCookieHeader(redirectUrl: string) {
  if (easyAuthorizedCookieCache && easyAuthorizedCookieCache.expiresAt > now()) {
    return easyAuthorizedCookieCache.promise;
  }

  const expiresAt = now() + EASY_AUTH_COOKIE_TTL_MS;
  const promise = createEasyAuthorizedCookieHeader(redirectUrl)
    .then((value) => {
      easyAuthorizedCookieCache = { expiresAt, promise: Promise.resolve(value), value };
      return value;
    })
    .catch((error: unknown) => {
      const message = getErrorMessage(error);
      easyAuthorizedCookieCache = {
        expiresAt: now() + 60 * 1000,
        promise: Promise.resolve(""),
        value: "",
        error: message,
      };
      return "";
    });

  easyAuthorizedCookieCache = { expiresAt, promise };
  return promise;
}

export const getNhkAuthorizedCookieHeader = getEasyAuthorizedCookieHeader;

export function getEasyCookieCacheState() {
  return {
    cached: Boolean(easyAuthorizedCookieCache?.value),
    expiresAt:
      easyAuthorizedCookieCache && easyAuthorizedCookieCache.expiresAt > now()
        ? new Date(easyAuthorizedCookieCache.expiresAt).toISOString()
        : null,
    error: easyAuthorizedCookieCache?.error ?? null,
  };
}

function buildNormalizedArticle(
  input: Omit<
    NormalizedArticle,
    "publishedAt" | "readingMinutes" | "imageStyle" | "savedWords" | "vocabularyIds"
  >,
) {
  const readingMinutes = Math.max(1, Math.ceil(input.content.join("").length / 120));
  const imageStyle = buildImageStyle(`${input.channel}:${input.id}:${input.title}`);
  const articleText = [input.title, input.summary, input.content.join(" ")].join("\n");
  const savedWords = chooseVocabularyItems(articleText, input.category);

  return {
    ...input,
    vocabularyIds: savedWords.map((word) => word.id),
    readingMinutes,
    publishedAt: formatPublishedAt(input.publishedAtIso),
    imageStyle,
    savedWords,
  } satisfies NormalizedArticle;
}

export async function loadEasyArticles(): Promise<SourceLoadResult> {
  try {
    const sitemap = await fetchText(NHK_EASY_SITEMAP_URL);
    const entries = parseSitemapEntries(sitemap)
      .filter((entry) => isEasyArticleUrl(entry.loc))
      .slice(0, EASY_ARTICLE_LIMIT);
    const authorizedCookieHeader =
      entries.length > 0 ? await getEasyAuthorizedCookieHeader(entries[0].loc) : "";

    let failedItems = 0;
    const fallbackArticles: NormalizedArticle[] = [];
    const articles = await Promise.all(
      entries.map(async (entry) => {
        try {
          if (!authorizedCookieHeader) {
            throw new Error("NHK EASY anonymous authorization cookie is empty");
          }

          const html = await fetchText(entry.loc, { cookie: authorizedCookieHeader });
          const { title, summary, content, publishedAtIso, imageUrl, fullContent } =
            extractEasyArticleData(html, entry.lastmod);
          const article = buildEasyNormalizedArticle({
            articleUrl: entry.loc,
            title,
            summary,
            content,
            publishedAtIso,
            imageUrl,
          });

          if (!fullContent) {
            throw new Error("NHK EASY returned truncated fallback content");
          }

          return article;
        } catch {
          const fallbackArticle = await loadEasyFallbackArticle(entry.loc, entry.lastmod);
          if (fallbackArticle) {
            fallbackArticles.push(fallbackArticle);
          }
          failedItems += 1;
          return null;
        }
      }),
    );

    const normalizedArticles = articles.filter(
      (article): article is NormalizedArticle => article !== null,
    );

    if (normalizedArticles.length === 0) {
      const cachedArticles = loadSourceArticlesFromCache("easy");
      if (cachedArticles.length > 0) {
        return {
          articles: cachedArticles,
          failedItems,
          error: "NHK EASY returned no complete articles",
        };
      }

      if (fallbackArticles.length > 0) {
        return {
          articles: fallbackArticles,
          failedItems,
          error: "NHK EASY returned only truncated bootstrap content",
        };
      }

      throw new Error("NHK EASY returned no complete articles");
    }

    const cachedArticles = loadSourceArticlesFromCache("easy");
    if (failedItems > 0 && cachedArticles.length > 0) {
      return {
        articles: cachedArticles,
        failedItems,
        error: `${failedItems} NHK EASY articles returned incomplete live content`,
      };
    }

    saveSourceArticlesToCache("easy", normalizedArticles);

    return {
      articles: normalizedArticles,
      failedItems,
    };
  } catch (error: unknown) {
    const cachedArticles = loadSourceArticlesFromCache("easy");

    if (cachedArticles.length > 0) {
      return {
        articles: cachedArticles,
        failedItems: 0,
        error: getErrorMessage(error),
      };
    }

    throw error;
  }
}

function buildEasyNormalizedArticle(input: {
  articleUrl: string;
  title: string;
  summary: string;
  content: string[];
  publishedAtIso: string;
  imageUrl: string;
}) {
  const category = guessCategoryFromText(
    [input.title, input.summary, input.content.join(" ")].join(" "),
  );

  return buildNormalizedArticle({
    id: input.articleUrl.match(/\/(ne\d+)\/\1\.html$/i)?.[1] ?? input.articleUrl,
    channel: "easy",
    title: input.title,
    source: "NHK EASY",
    category,
    summary: input.summary,
    publishedAtIso: input.publishedAtIso,
    image: input.imageUrl
      ? {
          type: "remote",
          value: input.imageUrl,
          alt: input.title,
        }
      : {
          type: "gradient",
          value: buildImageStyle(input.title),
          alt: `${input.title} cover`,
        },
    content: input.content,
    tagLabel: "简单日语",
  });
}

async function loadEasyFallbackArticle(articleUrl: string, fallbackPublishedAt?: string) {
  try {
    const html = await fetchText(articleUrl);
    const { title, summary, content, publishedAtIso, imageUrl } = extractEasyArticleData(
      html,
      fallbackPublishedAt,
    );

    return buildEasyNormalizedArticle({
      articleUrl,
      title,
      summary,
      content,
      publishedAtIso,
      imageUrl,
    });
  } catch {
    return null;
  }
}

export async function loadNewsWebArticles(): Promise<SourceLoadResult> {
  try {
    const sitemap = await fetchText(NHK_NEWS_WEB_SITEMAP_URL);
    const entries = parseSitemapEntries(sitemap)
      .filter((entry) => isNewsWebOriginalArticleUrl(entry.loc))
      .slice(0, ORIGINAL_ARTICLE_LIMIT);
    const authorizedCookieHeader =
      entries.length > 0 ? await getNhkAuthorizedCookieHeader(entries[0].loc) : "";

    let failedItems = 0;
    const articles = await Promise.all(
      entries.map(async (entry) => {
        try {
          const articleId = extractNewsWebOriginalArticleId(entry.loc);
          return await loadNewsWebArticleFromApi(articleId, {
            title: entry.title,
            publishedAtIso: entry.lastmod,
            authorizedCookieHeader,
          });
        } catch {
          failedItems += 1;
          return null;
        }
      }),
    );

    const normalizedArticles = articles.filter(
      (article): article is NormalizedArticle => article !== null,
    );

    if (normalizedArticles.length === 0) {
      throw new Error("NHK NEWS WEB returned no original articles");
    }

    saveSourceArticlesToCache("original", normalizedArticles);

    return {
      articles: normalizedArticles,
      failedItems,
    };
  } catch (error: unknown) {
    const cachedArticles = loadSourceArticlesFromCache("original");

    if (cachedArticles.length > 0) {
      return {
        articles: cachedArticles,
        failedItems: 0,
        error: getErrorMessage(error),
      };
    }

    throw error;
  }
}

async function loadNewsWebArticleFromApi(
  articleId: string,
  options?: {
    title?: string;
    publishedAtIso?: string;
    authorizedCookieHeader?: string;
  },
) {
  if (!/^na-k\d+$/i.test(articleId)) {
    return null;
  }

  const canonicalUrl = `${NHK_NEWS_WEB_ARTICLE_URL_BASE}/${articleId}`;
  const authorizedCookieHeader =
    options?.authorizedCookieHeader ?? (await getNhkAuthorizedCookieHeader(canonicalUrl));
  const jsonText = await fetchText(`${NHK_NEWS_WEB_ARTICLE_API_BASE}/${articleId}.json`, {
    cookie: authorizedCookieHeader,
  });
  const articleData = extractNewsWebOriginalArticleData(JSON.parse(jsonText), {
    id: articleId,
    title: options?.title,
    publishedAtIso: options?.publishedAtIso,
  });
  const category = guessCategoryFromText(
    [
      articleData.title,
      articleData.summary,
      articleData.topicLabel,
      articleData.content.join(" "),
    ].join(" "),
  );

  const article = buildNormalizedArticle({
    id: articleData.id,
    channel: "original",
    title: articleData.title,
    source: articleData.source,
    category,
    summary: articleData.summary || articleData.title,
    publishedAtIso: articleData.publishedAtIso,
    image: articleData.imageUrl
      ? {
          type: "remote",
          value: articleData.imageUrl,
          alt: articleData.title,
        }
      : {
          type: "gradient",
          value: buildImageStyle(articleData.title),
          alt: `${articleData.title} cover`,
        },
    content: articleData.content,
    tagLabel: "实时新闻",
  });

  saveArticleToCache("original", article);
  return article;
}

export async function loadNewsWebArticleById(articleId: string) {
  try {
    const article = await loadNewsWebArticleFromApi(articleId);

    if (article) {
      return article;
    }
  } catch {
    // Use the persistent cache below when live NHK requests fail.
  }

  return loadArticleFromCache("original", articleId);
}
