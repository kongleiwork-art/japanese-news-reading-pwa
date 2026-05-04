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
export type ConcreteArticleCategory = Exclude<ArticleCategory, "全部">;

export type VocabularyItem = {
  id: string;
  surface: string;
  aliases?: string[];
  reading: string;
  romaji: string;
  level: "N1" | "N2" | "N3" | "N4" | "N5";
  partOfSpeech: string;
  meanings: string[];
  englishMeanings?: string[];
  source?: "local" | "jisho";
  generated?: boolean;
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
  category: ConcreteArticleCategory;
  summary: string;
  readingMinutes: number;
  publishedAt: string;
  image: ArticleImage;
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
  category: ConcreteArticleCategory;
  summary: string;
  readingMinutes: number;
  publishedAt: string;
  image: ArticleImage;
};

export type StandardizedArticleDetail = StandardizedArticlePreview & {
  content: string[];
  vocabularyIds: string[];
};

export type NormalizedArticle = StandardizedArticleDetail & {
  publishedAtIso: string;
  tagLabel: string;
  imageStyle: string;
  savedWords: VocabularyItem[];
};

export type SitemapEntry = {
  loc: string;
  lastmod?: string;
  title?: string;
};

export type SourceHealthStatus = "idle" | "loading" | "ready" | "degraded" | "failed";

export type ArticleSourceHealth = {
  source: ArticleChannel;
  status: SourceHealthStatus;
  itemCount: number;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastSuccessfulAt: string | null;
  cacheExpiresAt: string | null;
  error: string | null;
};
