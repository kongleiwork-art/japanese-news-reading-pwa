export const articleChannels = ["easy", "original"] as const;
export type ArticleChannel = (typeof articleChannels)[number];

export const articleCategories = [
  "全部",
  "科技",
  "经济",
  "环境",
  "体育",
  "文化",
  "政治",
] as const;
export type ArticleCategory = (typeof articleCategories)[number];

export type VocabularyItem = {
  id: string;
  surface: string;
  reading: string;
  romaji: string;
  level: "N1" | "N2" | "N3" | "N4";
  partOfSpeech: string;
  meanings: string[];
  examples: {
    japanese: string;
    kana: string;
    chinese: string;
  }[];
  aiNote: string;
  savedAt: string;
  reviewCount: number;
};

export type ArticleImage = {
  type: "gradient" | "remote";
  value: string;
  alt: string;
};

export type ArticlePreview = {
  id: string;
  channel: ArticleChannel;
  title: string;
  source: string;
  category: Exclude<ArticleCategory, "全部">;
  summary: string;
  readingMinutes: number;
  publishedAt: string;
  imageStyle: string;
};

export type ArticleDetail = ArticlePreview & {
  tagLabel: string;
  content: string[];
  savedWords: VocabularyItem[];
};

export type StandardizedArticlePreview = {
  id: string;
  channel: ArticleChannel;
  title: string;
  source: string;
  category: Exclude<ArticleCategory, "全部">;
  summary: string;
  readingMinutes: number;
  publishedAt: string;
  image: ArticleImage;
};

export type StandardizedArticleDetail = StandardizedArticlePreview & {
  content: string[];
  vocabularyIds: string[];
};

type NormalizedArticle = StandardizedArticleDetail & {
  publishedAtIso: string;
  tagLabel: string;
  imageStyle: string;
  savedWords: VocabularyItem[];
};

type SitemapEntry = {
  loc: string;
  lastmod?: string;
  title?: string;
};

type CachedPromise<T> = {
  expiresAt: number;
  promise: Promise<T>;
};

const NHK_EASY_SITEMAP_URL = "https://news.web.nhk/news/easy/sitemap/sitemap.xml";
const TBS_NEWS_DIG_LATEST_URL = "https://newsdig.tbs.co.jp/list/latest";

const EASY_ARTICLE_LIMIT = 12;
const ORIGINAL_ARTICLE_LIMIT = 12;
const ARTICLES_CACHE_TTL_MS = 10 * 60 * 1000;

const vocabularyCatalog: Record<string, VocabularyItem> = {
  technique: {
    id: "technique",
    surface: "技術",
    reading: "ぎじゅつ",
    romaji: "gijutsu",
    level: "N3",
    partOfSpeech: "名词",
    meanings: ["技术", "工艺"],
    examples: [
      {
        japanese: "日本の技術は世界で高く評価されています。",
        kana: "にほんのぎじゅつはせかいでたかくひょうかされています。",
        chinese: "日本的技术在世界范围内很受认可。",
      },
    ],
    aiNote:
      "“技術”在新闻里很常见，既可以指核心技术，也可以指企业或国家的研发实力。",
    savedAt: "04/25",
    reviewCount: 2,
  },
  ai: {
    id: "ai",
    surface: "人工知能",
    reading: "じんこうちのう",
    romaji: "jinkou chinou",
    level: "N1",
    partOfSpeech: "名词",
    meanings: ["人工智能", "AI"],
    examples: [
      {
        japanese: "人工知能の発展が著しいです。",
        kana: "じんこうちのうのはってんがいちじるしいです。",
        chinese: "人工智能的发展非常显著。",
      },
    ],
    aiNote: "“人工知能”比“AI”更书面，NHK 报道里往往会两种说法交替出现。",
    savedAt: "04/25",
    reviewCount: 2,
  },
  growth: {
    id: "growth",
    surface: "成長",
    reading: "せいちょう",
    romaji: "seichou",
    level: "N3",
    partOfSpeech: "名词",
    meanings: ["成长", "增长"],
    examples: [
      {
        japanese: "経済成長が続いています。",
        kana: "けいざいせいちょうがつづいています。",
        chinese: "经济增长仍在持续。",
      },
    ],
    aiNote: "“成長”既可以说人的成长，也常用于经济、市场和企业增长。",
    savedAt: "04/24",
    reviewCount: 1,
  },
  environment: {
    id: "environment",
    surface: "環境",
    reading: "かんきょう",
    romaji: "kankyou",
    level: "N3",
    partOfSpeech: "名词",
    meanings: ["环境", "自然环境"],
    examples: [
      {
        japanese: "環境を守る取り組みが必要です。",
        kana: "かんきょうをまもるとりくみがひつようです。",
        chinese: "需要保护环境的举措。",
      },
    ],
    aiNote:
      "“環境”在新闻中可以指自然环境，也可以指工作或生活环境，需要看上下文判断。",
    savedAt: "04/23",
    reviewCount: 1,
  },
  society: {
    id: "society",
    surface: "社会",
    reading: "しゃかい",
    romaji: "shakai",
    level: "N4",
    partOfSpeech: "名词",
    meanings: ["社会", "社会环境"],
    examples: [
      {
        japanese: "社会問題について話し合いました。",
        kana: "しゃかいもんだいについてはなしあいました。",
        chinese: "大家讨论了社会问题。",
      },
    ],
    aiNote: "“社会に出る”是高频表达，意思是进入职场或正式步入社会。",
    savedAt: "04/22",
    reviewCount: 3,
  },
};

let normalizedArticlesCache: CachedPromise<NormalizedArticle[]> | null = null;

const categoryKeywordMap: Record<
  Exclude<ArticleCategory, "全部">,
  readonly string[]
> = {
  科技: [
    "ai",
    "ＡＩ",
    "人工知能",
    "技術",
    "半導体",
    "研究",
    "科学",
    "宇宙",
    "開発",
  ],
  经济: [
    "経済",
    "金融",
    "企業",
    "銀行",
    "株",
    "投資",
    "円",
    "物価",
    "賃金",
    "輸出",
    "買収",
  ],
  环境: [
    "環境",
    "気候",
    "脱炭素",
    "再生可能",
    "災害",
    "地震",
    "津波",
    "台風",
    "大雨",
    "天気",
  ],
  体育: [
    "スポーツ",
    "野球",
    "サッカー",
    "バスケット",
    "五輪",
    "オリンピック",
    "大会",
    "優勝",
  ],
  文化: [
    "文化",
    "芸術",
    "映画",
    "音楽",
    "アニメ",
    "祭り",
    "文学",
    "展示",
  ],
  政治: [
    "政治",
    "政府",
    "首相",
    "大統領",
    "国会",
    "選挙",
    "防衛",
    "外交",
    "行政",
  ],
};

const topicLabelCategoryMap: Record<string, Exclude<ArticleCategory, "全部">> = {
  "科学・文化": "科技",
  科学文化: "科技",
  科学: "科技",
  文化: "文化",
  経済: "经济",
  金融: "经济",
  環境: "环境",
  "気象・災害": "环境",
  気象災害: "环境",
  災害: "环境",
  スポーツ: "体育",
  政治: "政治",
  社会: "政治",
  国際: "政治",
  暮らし: "文化",
};

const fallbackVocabularyByCategory: Record<
  Exclude<ArticleCategory, "全部">,
  readonly string[]
> = {
  科技: ["technique", "ai"],
  经济: ["growth"],
  环境: ["environment"],
  体育: ["society"],
  文化: ["society"],
  政治: ["society"],
};

function now() {
  return Date.now();
}

function getCachedPromise<T>(
  cache: CachedPromise<T> | null,
  loader: () => Promise<T>,
): CachedPromise<T> {
  if (cache && cache.expiresAt > now()) {
    return cache;
  }

  return {
    expiresAt: now() + ARTICLES_CACHE_TTL_MS,
    promise: loader(),
  };
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; QingduJapaneseBot/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function decodeHtml(value: string) {
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
    .replace(/&hellip;/g, "…");
}

function normalizeWhitespace(value: string) {
  return decodeHtml(stripTags(value))
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractMetaContent(html: string, name: string) {
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)=["']${escapeRegExp(name)}["'][^>]+content=["']([\\s\\S]*?)["']`,
    "i",
  );
  return html.match(pattern)?.[1];
}

function extractTagText(html: string, tagName: string) {
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i");
  const match = html.match(pattern);
  return match ? normalizeWhitespace(match[1]) : "";
}

function extractFlightString(html: string, marker: string) {
  const pattern = new RegExp(`${escapeRegExp(marker)}":"([\\s\\S]*?)"`);
  const match = html.match(pattern);
  return match ? decodeEscapedJsonText(match[1]) : "";
}

function decodeEscapedJsonText(value: string) {
  try {
    return JSON.parse(`"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  } catch {
    return value
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
}

function parseSitemapEntries(xml: string) {
  return Array.from(xml.matchAll(/<url>([\s\S]*?)<\/url>/g)).map((match) => {
    const block = match[1];
    return {
      loc: block.match(/<loc>([\s\S]*?)<\/loc>/i)?.[1]?.trim() ?? "",
      lastmod: block.match(/<lastmod>([\s\S]*?)<\/lastmod>/i)?.[1]?.trim(),
      title: block.match(/<news:title>([\s\S]*?)<\/news:title>/i)?.[1]?.trim(),
    } satisfies SitemapEntry;
  });
}

function isEasyArticleUrl(url: string) {
  return /\/news\/easy\/ne\d+\/ne\d+\.html$/i.test(url);
}

function isOriginalArticleUrl(url: string) {
  return /\/articles\/-\/\d+(?:\?display=1)?$/i.test(url);
}

function toTokyoDateOnlyIso(dateText?: string) {
  if (!dateText) {
    return new Date().toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return `${dateText}T09:00:00+09:00`;
  }

  return dateText;
}

function estimateReadingMinutes(paragraphs: string[]) {
  const characters = paragraphs.join("").length;
  return Math.max(1, Math.ceil(characters / 120));
}

function formatPublishedAt(publishedAtIso: string) {
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildImageStyle(seed: string) {
  const hash = Array.from(seed).reduce((accumulator, character) => {
    return (accumulator * 33 + character.codePointAt(0)!) % 360;
  }, 0);
  const hueA = hash;
  const hueB = (hash + 42) % 360;
  const hueC = (hash + 108) % 360;

  return `linear-gradient(140deg, hsla(${hueA} 55% 84% / 0.95), hsla(${hueB} 48% 62% / 0.9)), radial-gradient(circle at 20% 20%, hsla(${hueC} 80% 96% / 0.8), transparent 32%), linear-gradient(180deg, hsl(${hueA} 24% 88%) 0%, hsl(${hueB} 28% 74%) 44%, hsl(${hueC} 24% 56%) 100%)`;
}

function dedupe<T>(items: T[]) {
  return [...new Set(items)];
}

function guessCategoryFromText(text: string) {
  const haystack = text.toLowerCase();
  let bestCategory: Exclude<ArticleCategory, "全部"> = "政治";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(categoryKeywordMap) as Array<
    [Exclude<ArticleCategory, "全部">, readonly string[]]
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mapTopicLabelToCategory(label?: string | null) {
  if (!label) {
    return null;
  }

  const normalized = normalizeWhitespace(label).replace(/\s+/g, "");

  for (const [keyword, category] of Object.entries(topicLabelCategoryMap)) {
    if (normalized.includes(keyword)) {
      return category;
    }
  }

  return mapTopicLabelToCategory(label);
}

function getVocabularyById(wordId: string) {
  const word = vocabularyCatalog[wordId];

  if (!word) {
    throw new Error(`Unknown vocabulary id: ${wordId}`);
  }

  return word;
}

function chooseVocabularyIds(text: string, category: Exclude<ArticleCategory, "全部">) {
  const directMatches = Object.values(vocabularyCatalog)
    .filter((item) => text.includes(item.surface))
    .map((item) => item.id);

  if (/(?:AI|ＡＩ|人工知能)/i.test(text)) {
    directMatches.push("ai");
  }

  const fallback = fallbackVocabularyByCategory[category] ?? [];
  return dedupe([...directMatches, ...fallback]).slice(0, 3);
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

function toScreenPreview(article: NormalizedArticle): ArticlePreview {
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

function buildNormalizedArticle(
  input: Omit<NormalizedArticle, "publishedAt" | "readingMinutes" | "imageStyle" | "savedWords">,
) {
  const readingMinutes = estimateReadingMinutes(input.content);
  const imageStyle = buildImageStyle(`${input.channel}:${input.id}:${input.title}`);

  return {
    ...input,
    readingMinutes,
    publishedAt: formatPublishedAt(input.publishedAtIso),
    imageStyle,
    savedWords: input.vocabularyIds.map(getVocabularyById),
  } satisfies NormalizedArticle;
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
    .map((line) => line.replace(/\.\.\.$/, "…"));

  const visibleMessage = normalizeWhitespace(
    html.match(/<div class="_12wzy4o3"[\s\S]*?<\/div>/)?.[0] ?? "",
  );

  if (visibleMessage && !summaryLines.includes(visibleMessage)) {
    return [...summaryLines, visibleMessage].slice(0, 4);
  }

  return summaryLines.length > 0 ? summaryLines : [summary];
}

function parseLatestArticleLinks(html: string) {
  const links = Array.from(html.matchAll(/href="(\/articles\/-\/\d+\?display=1)"/gi))
    .map((match) => `https://newsdig.tbs.co.jp${match[1]}`)
    .filter((link) => isOriginalArticleUrl(link));

  return dedupe(links).slice(0, ORIGINAL_ARTICLE_LIMIT);
}

function splitJapaneseParagraphs(text: string, sentencesPerParagraph = 2) {
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

function extractNewsWebTitle(html: string) {
  const h1 = extractTagText(html, "h1");
  if (h1) {
    return trimNewsSourceSuffix(h1, "TBS NEWS DIG");
  }

  const metaTitle = normalizeWhitespace(extractMetaContent(html, "og:title") ?? "");
  return trimNewsSourceSuffix(metaTitle, "TBS NEWS DIG");
}

function extractNewsWebSummary(html: string) {
  const content = extractNewsWebContent(html, "");
  if (content.length > 0) {
    return content[0];
  }

  const metaDescription = normalizeWhitespace(extractMetaContent(html, "description") ?? "");
  return metaDescription.replace(/\s*\(1ページ\)\s*$/u, "");
}

function extractNewsWebContent(html: string, summary: string) {
  const paragraphs = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => normalizeWhitespace(match[1]))
    .filter((paragraph) => {
      if (!paragraph) {
        return false;
      }

      if (/^To view this video please enable JavaScript/i.test(paragraph)) {
        return false;
      }

      return paragraph.length >= 40;
    });

  const mainParagraph = paragraphs[0];
  if (mainParagraph) {
    return splitJapaneseParagraphs(mainParagraph);
  }

  return splitJapaneseParagraphs(summary)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function extractNewsWebPublishedAt(html: string, fallback?: string) {
  const dateTime =
    html.match(/<time[^>]+class="article-header-time"[^>]+datetime="([^"]+)"/i)?.[1] ??
    html.match(/<time[^>]+datetime="([^"]+)"/i)?.[1];
  return dateTime ?? toTokyoDateOnlyIso(fallback);
}

function extractNewsWebTopicLabel(html: string) {
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

function extractNewsWebBroadcaster(html: string) {
  const broadcaster = html.match(
    /article-header-broadcaster__logo[\s\S]*?alt="">\s*([\s\S]*?)\s*<\/div>/i,
  )?.[1];

  return broadcaster ? normalizeWhitespace(broadcaster) : "TBS NEWS DIG";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mapOriginalTopicLabelToCategory(label?: string | null) {
  if (!label) {
    return null;
  }

  const normalized = normalizeWhitespace(label).replace(/\s+/g, "");

  if (normalized.includes("経済") || normalized.includes("マネー")) {
    return "缁忔祹";
  }

  if (normalized.includes("スポーツ")) {
    return "浣撹偛";
  }

  if (
    normalized.includes("天気") ||
    normalized.includes("地震") ||
    normalized.includes("災害")
  )
  {
    return "鐜";
  }

  if (
    normalized.includes("エンタメ") ||
    normalized.includes("話題") ||
    normalized.includes("グルメ") ||
    normalized.includes("ドキュメンタリー")
  ) {
    return "鏂囧寲";
  }

  if (normalized.includes("国内") || normalized.includes("国際")) {
    return "鏀挎不";
  }

  return null;
}

async function loadEasyArticles() {
  const sitemap = await fetchText(NHK_EASY_SITEMAP_URL);
  const entries = parseSitemapEntries(sitemap)
    .filter((entry) => isEasyArticleUrl(entry.loc))
    .slice(0, EASY_ARTICLE_LIMIT);

  const articles = await Promise.all(
    entries.map(async (entry) => {
      try {
        const html = await fetchText(entry.loc);
        const title = extractEasyTitle(html);
        const summary = extractEasySummary(html);
        const content = extractEasyContent(html, summary);
        const category = guessCategoryFromText([title, summary, content.join(" ")].join(" "));
        const vocabularyIds = chooseVocabularyIds(
          [title, summary, content.join(" ")].join("\n"),
          category,
        );
        const imageUrl = extractMetaContent(html, "og:image") ?? "";

        return buildNormalizedArticle({
          id: entry.loc.match(/\/(ne\d+)\/\1\.html$/i)?.[1] ?? entry.loc,
          channel: "easy",
          title,
          source: "NHK EASY",
          category,
          summary,
          publishedAtIso: toTokyoDateOnlyIso(entry.lastmod),
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
          vocabularyIds,
          tagLabel: "简单日语",
        });
      } catch {
        return null;
      }
    }),
  );

  return articles.filter((article): article is NormalizedArticle => article !== null);
}

async function loadNewsWebArticles() {
  const latestPage = await fetchText(TBS_NEWS_DIG_LATEST_URL);
  const articleUrls = parseLatestArticleLinks(latestPage);

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
        const vocabularyIds = chooseVocabularyIds(
          [title, summary, topicLabel, content.join(" ")].join("\n"),
          category,
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
          vocabularyIds,
          tagLabel: "实时新闻",
        });
      } catch {
        return null;
      }
    }),
  );

  return articles.filter((article): article is NormalizedArticle => article !== null);
}

async function loadNormalizedArticles() {
  const [easyArticles, newsWebArticles] = await Promise.all([
    loadEasyArticles(),
    loadNewsWebArticles(),
  ]);

  return [...easyArticles, ...newsWebArticles].sort(
    (left, right) =>
      new Date(right.publishedAtIso).getTime() - new Date(left.publishedAtIso).getTime(),
  );
}

async function getNormalizedArticles() {
  normalizedArticlesCache = getCachedPromise(normalizedArticlesCache, loadNormalizedArticles);
  return normalizedArticlesCache.promise;
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
