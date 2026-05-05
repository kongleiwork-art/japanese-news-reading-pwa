import type { SitemapEntry } from "./types.ts";
import {
  decodeHtml,
  dedupe,
  escapeRegExp,
  extractFlightString,
  extractMetaContent,
  extractTagText,
  normalizeWhitespace,
  toTokyoDateOnlyIso,
} from "./utils.ts";

export type ParsedArticleData = {
  title: string;
  summary: string;
  content: string[];
  publishedAtIso: string;
  imageUrl: string;
};

export function parseSitemapEntries(xml: string) {
  return Array.from(xml.matchAll(/<url>([\s\S]*?)<\/url>/g)).map((match) => {
    const block = match[1];
    return {
      loc: decodeHtml(block.match(/<loc>([\s\S]*?)<\/loc>/i)?.[1]?.trim() ?? ""),
      lastmod: block.match(/<lastmod>([\s\S]*?)<\/lastmod>/i)?.[1]?.trim(),
      title: decodeHtml(block.match(/<news:title>([\s\S]*?)<\/news:title>/i)?.[1]?.trim() ?? ""),
    } satisfies SitemapEntry;
  });
}

export function isEasyArticleUrl(url: string) {
  return /\/news\/easy\/ne\d+\/ne\d+\.html$/i.test(url);
}

export function isOriginalArticleUrl(url: string) {
  return /\/articles\/-\/\d+(?:\?display=1)?$/i.test(url);
}

export function stripRubyAnnotationTags(value: string) {
  return value
    .replace(/<rt[^>]*>[\s\S]*?<\/rt>/gi, "")
    .replace(/<rp[^>]*>[\s\S]*?<\/rp>/gi, "")
    .replace(/<\/?ruby[^>]*>/gi, "");
}

export function normalizeRubyHtml(value: string) {
  return normalizeWhitespace(stripRubyAnnotationTags(value));
}

export function parseEasyClassicPublishedAt(html: string, fallback?: string) {
  const dateText = normalizeRubyHtml(
    html.match(/<p[^>]+class="article-date"[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "",
  );
  const match = dateText.match(
    /(?<year>\d{4})年\s*(?<month>\d{1,2})月\s*(?<day>\d{1,2})日\s+(?<hour>\d{1,2})時\s*(?<minute>\d{1,2})分/u,
  );

  if (!match?.groups) {
    return toTokyoDateOnlyIso(fallback);
  }

  const { year, month, day, hour, minute } = match.groups;
  return (
    `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}` +
    `T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00+09:00`
  );
}

export function extractEasyClassicTitle(html: string) {
  const title = normalizeRubyHtml(
    html.match(/<h1[^>]+class="article-title"[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "",
  );

  return title || extractEasyTitle(html);
}

export function extractEasyClassicContent(html: string) {
  const bodyHtml =
    html.match(
      /<div[^>]+class="article-body"[^>]+id="js-article-body"[^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]+class="article-share"|<div[^>]+class="article-link"|<\/article>)/i,
    )?.[1] ??
    html.match(/<div[^>]+id="js-article-body"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ??
    "";

  return Array.from(bodyHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => normalizeRubyHtml(match[1]))
    .filter(Boolean);
}

export function extractEasyClassicSummary(html: string, content: string[]) {
  const metaDescription = normalizeRubyHtml(extractMetaContent(html, "description") ?? "").replace(
    /\s*\.\.\.\s*$/u,
    "",
  );

  if (metaDescription && metaDescription !== "...") {
    return metaDescription;
  }

  return content.slice(0, 2).join("\n\n") || content[0] || extractEasySummary(html);
}

export function extractEasyArticleData(
  html: string,
  fallbackPublishedAt?: string,
): ParsedArticleData {
  const classicContent = extractEasyClassicContent(html);

  if (classicContent.length > 0) {
    return {
      title: extractEasyClassicTitle(html),
      summary: extractEasyClassicSummary(html, classicContent),
      content: classicContent,
      publishedAtIso: parseEasyClassicPublishedAt(html, fallbackPublishedAt),
      imageUrl: extractMetaContent(html, "og:image") ?? "",
    };
  }

  const title = extractEasyTitle(html);
  const summary = extractEasySummary(html);

  return {
    title,
    summary,
    content: extractEasyContent(html, summary),
    publishedAtIso: toTokyoDateOnlyIso(fallbackPublishedAt),
    imageUrl: extractMetaContent(html, "og:image") ?? "",
  };
}

function extractEasySummary(html: string) {
  const metaDescription = extractMetaContent(html, "description");
  const flightSummary = extractFlightString(html, "children");
  const summary = normalizeWhitespace(metaDescription ?? flightSummary);

  if (!summary) {
    return "NHK EASY 详情页暂时没有返回可解析摘要。";
  }

  return summary;
}

function extractEasyTitle(html: string) {
  const h1 = extractTagText(html, "h1");
  if (h1) {
    return h1.replace(/\s*\|\s*NHKやさしいことばニュース\s*$/i, "");
  }

  const metaTitle = normalizeWhitespace(extractMetaContent(html, "og:title") ?? "");
  return metaTitle.replace(/\s*\|\s*NHKやさしいことばニュース\s*$/i, "");
}

function extractEasyContent(html: string, summary: string) {
  const summaryLines = summary
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/\.\.\.$/, "..."));

  const visibleMessage = normalizeWhitespace(
    html.match(/<div class="_12wzy4o3"[\s\S]*?<\/div>/)?.[0] ?? "",
  );

  if (visibleMessage && !summaryLines.includes(visibleMessage)) {
    return [...summaryLines, visibleMessage].slice(0, 4);
  }

  return summaryLines.length > 0 ? summaryLines : [summary];
}

export function parseLatestArticleLinks(html: string) {
  const links = Array.from(
    html.matchAll(/href="(\/articles\/-\/\d+(?:\?display=1)?)"/gi),
  )
    .map((match) => {
      const path = match[1];
      return `https://newsdig.tbs.co.jp${path.includes("?") ? path : `${path}?display=1`}`;
    })
    .filter((link) => isOriginalArticleUrl(link));

  return dedupe(links);
}

export function splitJapaneseParagraphs(text: string, sentencesPerParagraph = 2) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[。！？])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return text ? [text] : [];
  }

  const paragraphs: string[] = [];

  for (let index = 0; index < sentences.length; index += sentencesPerParagraph) {
    paragraphs.push(sentences.slice(index, index + sentencesPerParagraph).join(""));
  }

  return paragraphs;
}

function trimNewsSourceSuffix(title: string, source: string) {
  return title
    .replace(new RegExp(`\\s*\\|\\s*${escapeRegExp(source)}(?:\\s*\\([^)]*\\))?$`, "i"), "")
    .trim();
}

export function extractNewsWebTitle(html: string) {
  const h1 = extractTagText(html, "h1");
  if (h1) {
    return trimNewsSourceSuffix(h1, "TBS NEWS DIG");
  }

  const metaTitle = normalizeWhitespace(extractMetaContent(html, "og:title") ?? "");
  return trimNewsSourceSuffix(metaTitle, "TBS NEWS DIG");
}

export function extractNewsWebSummary(html: string) {
  const content = extractNewsWebContent(html, "");
  if (content.length > 0) {
    return content[0];
  }

  const metaDescription = normalizeWhitespace(extractMetaContent(html, "description") ?? "");
  return metaDescription.replace(/\s*\(1ページ\)\s*$/u, "");
}

export function extractNewsWebContent(html: string, summary: string) {
  const bodyMatch = html.match(
    /<div[^>]+class="[^"]*\barticle-body\b[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]+class="article-footer\b/i,
  );
  const bodyHtml = bodyMatch?.[1] ?? html;
  const minimumParagraphLength = bodyMatch ? 12 : 40;
  const paragraphs = Array.from(bodyHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .flatMap((match) => normalizeNewsWebParagraph(match[1]))
    .filter((paragraph) => {
      if (!paragraph) {
        return false;
      }

      if (/^To view this video please enable JavaScript/i.test(paragraph)) {
        return false;
      }

      return paragraph.length >= minimumParagraphLength;
    });

  if (paragraphs.length > 0) {
    return paragraphs.flatMap((paragraph) => splitJapaneseParagraphs(paragraph));
  }

  return splitJapaneseParagraphs(summary)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function normalizeNewsWebParagraph(html: string) {
  return normalizeWhitespace(html.replace(/<br\s*\/?>/gi, "\n"))
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function extractNewsWebPublishedAt(html: string, fallback?: string) {
  const dateTime =
    html.match(/<time[^>]+class="article-header-time"[^>]+datetime="([^"]+)"/i)?.[1] ??
    html.match(/<time[^>]+datetime="([^"]+)"/i)?.[1];
  return dateTime ?? toTokyoDateOnlyIso(fallback);
}

export function extractNewsWebTopicLabel(html: string) {
  const topicLink = html.match(
    /<a[^>]+class="article-header-tag__item[^"]*"[^>]*>([\s\S]*?)<\/a>/i,
  )?.[1];

  if (topicLink) {
    return normalizeWhitespace(topicLink);
  }

  const breadcrumbTopic = html.match(
    /<a[^>]+href="\/list\/genre\/[^"]+"[^>]*class="m-breadcrumb__link"[^>]*>([\s\S]*?)<\/a>/i,
  )?.[1];

  return breadcrumbTopic ? normalizeWhitespace(breadcrumbTopic) : "";
}

export function extractNewsWebBroadcaster(html: string) {
  const broadcaster = html.match(
    /article-header-broadcaster__logo[\s\S]*?alt="">\s*([\s\S]*?)\s*<\/div>/i,
  )?.[1];

  return broadcaster ? normalizeWhitespace(broadcaster) : "TBS NEWS DIG";
}
