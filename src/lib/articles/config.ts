import type { ConcreteArticleCategory } from "./types.ts";

export const NHK_EASY_SITEMAP_URL =
  "https://news.web.nhk/news/easy/sitemap/sitemap.xml";
export const NHK_EASY_AUTHORIZATION_URL = "https://www.web.nhk/tix/build_authorize";
export const TBS_NEWS_DIG_LATEST_URL = "https://newsdig.tbs.co.jp/list/latest";

export const EASY_ARTICLE_LIMIT = 12;
export const ORIGINAL_ARTICLE_LIMIT = 12;

export const ARTICLES_CACHE_TTL_MS = 10 * 60 * 1000;
export const EASY_AUTH_COOKIE_TTL_MS = 30 * 60 * 1000;

export const USER_AGENT = "Mozilla/5.0 (compatible; QingduJapaneseBot/1.0)";

export type EasyConsentArea = {
  areaId: string;
  jisx0402: string;
  postal: string;
  pref: string;
};

export const NHK_EASY_DEFAULT_AREA: EasyConsentArea = {
  areaId: "130",
  jisx0402: "13101",
  postal: "1000001",
  pref: "13",
};

export const categoryKeywordMap: Record<ConcreteArticleCategory, readonly string[]> = {
  科技: [
    "AI",
    "人工知能",
    "技術",
    "半導体",
    "研究",
    "科学",
    "宇宙",
    "開発",
    "デジタル",
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
    "社会",
    "国内",
    "国際",
  ],
};
