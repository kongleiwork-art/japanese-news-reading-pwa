import { categoryKeywordMap, USER_AGENT } from "./config.ts";
import { articleCategories, type ArticleCategory, type ConcreteArticleCategory } from "./types.ts";

export async function fetchText(url: string, extraHeaders?: Record<string, string>) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent": USER_AGENT,
      ...extraHeaders,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export function getSetCookieHeaders(response: Response) {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const setCookie = response.headers.get("set-cookie");
  return setCookie ? [setCookie] : [];
}

export function mergeCookieJar(cookieJar: Map<string, string>, setCookieHeaders: string[]) {
  for (const header of setCookieHeaders) {
    const [nameValue] = header.split(";");
    const separatorIndex = nameValue.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const name = nameValue.slice(0, separatorIndex).trim();
    const value = nameValue.slice(separatorIndex + 1).trim();

    if (name) {
      cookieJar.set(name, value);
    }
  }
}

export function serializeCookieJar(cookieJar: Map<string, string>) {
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

export function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

export function decodeHtml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&hellip;/g, "...");
}

export function normalizeWhitespace(value: string) {
  return decodeHtml(stripTags(value))
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractMetaContent(html: string, name: string) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    const metaName = getHtmlAttribute(tag, "name") ?? getHtmlAttribute(tag, "property");

    if (metaName?.toLowerCase() !== name.toLowerCase()) {
      continue;
    }

    const content = getHtmlAttribute(tag, "content");
    if (content) {
      return decodeHtml(content);
    }
  }

  return undefined;
}

function getHtmlAttribute(tag: string, attributeName: string) {
  const pattern = new RegExp(
    `\\b${escapeRegExp(attributeName)}\\s*=\\s*(["'])([\\s\\S]*?)\\1`,
    "i",
  );
  return tag.match(pattern)?.[2];
}

export function extractTagText(html: string, tagName: string) {
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i");
  const match = html.match(pattern);
  return match ? normalizeWhitespace(match[1]) : "";
}

export function extractFlightString(html: string, marker: string) {
  const pattern = new RegExp(`${escapeRegExp(marker)}":"([\\s\\S]*?)"`);
  const match = html.match(pattern);
  return match ? decodeEscapedJsonText(match[1]) : "";
}

export function decodeEscapedJsonText(value: string) {
  try {
    return JSON.parse(`"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  } catch {
    return value
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function dedupe<T>(items: T[]) {
  return [...new Set(items)];
}

export function toTokyoDateOnlyIso(dateText?: string) {
  if (!dateText) {
    return new Date().toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return `${dateText}T09:00:00+09:00`;
  }

  return dateText;
}

export function estimateReadingMinutes(paragraphs: string[]) {
  const characters = paragraphs.join("").length;
  return Math.max(1, Math.ceil(characters / 120));
}

export function formatPublishedAt(publishedAtIso: string) {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });
  const parts = formatter.formatToParts(new Date(publishedAtIso));
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${month}月${day}日`;
}

export function buildImageStyle(seed: string) {
  const hash = Array.from(seed).reduce((accumulator, character) => {
    return (accumulator * 33 + character.codePointAt(0)!) % 360;
  }, 0);
  const hueA = hash;
  const hueB = (hash + 42) % 360;
  const hueC = (hash + 108) % 360;

  return `linear-gradient(140deg, hsla(${hueA} 55% 84% / 0.95), hsla(${hueB} 48% 62% / 0.9)), radial-gradient(circle at 20% 20%, hsla(${hueC} 80% 96% / 0.8), transparent 32%), linear-gradient(180deg, hsl(${hueA} 24% 88%) 0%, hsl(${hueB} 28% 74%) 44%, hsl(${hueC} 24% 56%) 100%)`;
}

export function guessCategoryFromText(text: string) {
  const haystack = text.toLowerCase();
  let bestCategory: ConcreteArticleCategory = "政治";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(categoryKeywordMap) as Array<
    [ConcreteArticleCategory, readonly string[]]
  >) {
    const score = keywords.reduce((count, keyword) => {
      const normalizedKeyword = keyword.toLowerCase();
      return haystack.includes(normalizedKeyword) ? count + 1 : count;
    }, 0);

    if (score > bestScore) {
      bestCategory = category;
      bestScore = score;
    }
  }

  return bestCategory;
}

export function isArticleCategory(value: string): value is ArticleCategory {
  return articleCategories.includes(value as ArticleCategory);
}
