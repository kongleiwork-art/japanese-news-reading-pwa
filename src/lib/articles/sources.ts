import {
  EASY_ARTICLE_LIMIT,
  EASY_AUTH_COOKIE_TTL_MS,
  NHK_EASY_AUTHORIZATION_URL,
  NHK_EASY_DEFAULT_AREA,
  NHK_EASY_SITEMAP_URL,
  ORIGINAL_ARTICLE_LIMIT,
  TBS_NEWS_DIG_LATEST_URL,
  USER_AGENT,
  type EasyConsentArea,
} from "./config.ts";
import {
  extractEasyArticleData,
  extractNewsWebBroadcaster,
  extractNewsWebContent,
  extractNewsWebPublishedAt,
  extractNewsWebSummary,
  extractNewsWebTitle,
  extractNewsWebTopicLabel,
  isEasyArticleUrl,
  parseLatestArticleLinks,
  parseSitemapEntries,
} from "./parsers.ts";
import type { NormalizedArticle } from "./types.ts";
import {
  buildImageStyle,
  extractMetaContent,
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
      const message = error instanceof Error ? error.message : String(error);
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
  const sitemap = await fetchText(NHK_EASY_SITEMAP_URL);
  const entries = parseSitemapEntries(sitemap)
    .filter((entry) => isEasyArticleUrl(entry.loc))
    .slice(0, EASY_ARTICLE_LIMIT);
  const authorizedCookieHeader =
    entries.length > 0 ? await getEasyAuthorizedCookieHeader(entries[0].loc) : "";

  let failedItems = 0;
  const articles = await Promise.all(
    entries.map(async (entry) => {
      try {
        const html = authorizedCookieHeader
          ? await fetchText(entry.loc, { cookie: authorizedCookieHeader }).catch(() =>
              fetchText(entry.loc),
            )
          : await fetchText(entry.loc);
        const { title, summary, content, publishedAtIso, imageUrl } = extractEasyArticleData(
          html,
          entry.lastmod,
        );
        const category = guessCategoryFromText([title, summary, content.join(" ")].join(" "));
        return buildNormalizedArticle({
          id: entry.loc.match(/\/(ne\d+)\/\1\.html$/i)?.[1] ?? entry.loc,
          channel: "easy",
          title,
          source: "NHK EASY",
          category,
          summary,
          publishedAtIso,
          image: imageUrl
            ? {
                type: "remote",
                value: imageUrl,
                alt: title,
              }
            : {
                type: "gradient",
                value: buildImageStyle(title),
                alt: `${title} cover`,
              },
          content,
          tagLabel: "简单日语",
        });
      } catch {
        failedItems += 1;
        return null;
      }
    }),
  );

  return {
    articles: articles.filter((article): article is NormalizedArticle => article !== null),
    failedItems,
  };
}

export async function loadNewsWebArticles(): Promise<SourceLoadResult> {
  const latestPage = await fetchText(TBS_NEWS_DIG_LATEST_URL);
  const articleUrls = parseLatestArticleLinks(latestPage).slice(0, ORIGINAL_ARTICLE_LIMIT);

  let failedItems = 0;
  const articles = await Promise.all(
    articleUrls.map(async (articleUrl) => {
      try {
        const html = await fetchText(articleUrl);
        const title = extractNewsWebTitle(html);
        const summary = extractNewsWebSummary(html);
        const content = extractNewsWebContent(html, summary);
        const topicLabel = extractNewsWebTopicLabel(html);
        const category = guessCategoryFromText(
          [title, summary, topicLabel, content.join(" ")].join(" "),
        );
        const imageUrl = extractMetaContent(html, "og:image") ?? "";
        const broadcaster = extractNewsWebBroadcaster(html);

        return buildNormalizedArticle({
          id: articleUrl.match(/\/articles\/-\/(\d+)/i)?.[1] ?? articleUrl,
          channel: "original",
          title,
          source: broadcaster,
          category,
          summary: summary || title,
          publishedAtIso: extractNewsWebPublishedAt(html),
          image: imageUrl
            ? {
                type: "remote",
                value: imageUrl,
                alt: title,
              }
            : {
                type: "gradient",
                value: buildImageStyle(title),
                alt: `${title} cover`,
              },
          content,
          tagLabel: "实时新闻",
        });
      } catch {
        failedItems += 1;
        return null;
      }
    }),
  );

  return {
    articles: articles.filter((article): article is NormalizedArticle => article !== null),
    failedItems,
  };
}

export async function loadNewsWebArticleById(articleId: string) {
  if (!/^\d+$/.test(articleId)) {
    return null;
  }

  const articleUrl = `https://newsdig.tbs.co.jp/articles/-/${articleId}?display=1`;
  const html = await fetchText(articleUrl);
  const title = extractNewsWebTitle(html);
  const summary = extractNewsWebSummary(html);
  const content = extractNewsWebContent(html, summary);
  const topicLabel = extractNewsWebTopicLabel(html);
  const category = guessCategoryFromText(
    [title, summary, topicLabel, content.join(" ")].join(" "),
  );
  const imageUrl = extractMetaContent(html, "og:image") ?? "";
  const broadcaster = extractNewsWebBroadcaster(html);

  return buildNormalizedArticle({
    id: articleId,
    channel: "original",
    title,
    source: broadcaster,
    category,
    summary: summary || title,
    publishedAtIso: extractNewsWebPublishedAt(html),
    image: imageUrl
      ? {
          type: "remote",
          value: imageUrl,
          alt: title,
        }
      : {
          type: "gradient",
          value: buildImageStyle(title),
          alt: `${title} cover`,
        },
    content,
    tagLabel: "实时新闻",
  });
}
