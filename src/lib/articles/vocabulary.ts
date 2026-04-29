import type { ConcreteArticleCategory, VocabularyItem } from "./types.ts";

export const vocabularyCatalog: Record<string, VocabularyItem> = {
  technique: {
    id: "technique",
    surface: "技術",
    reading: "ぎじゅつ",
    romaji: "gijutsu",
    level: "N3",
    partOfSpeech: "名詞",
    meanings: ["技术", "工艺"],
    examples: [
      {
        japanese: "日本の技術は世界で高く評価されています。",
        kana: "にほんのぎじゅつはせかいでたかくひょうかされています。",
        chinese: "日本的技术在世界范围内很受认可。",
      },
    ],
    aiNote: "新闻里常用来指企业、产业或国家的研发实力。",
    savedAt: "04/25",
    reviewCount: 2,
  },
  ai: {
    id: "ai",
    surface: "AI",
    reading: "エーアイ",
    romaji: "ee ai",
    level: "N2",
    partOfSpeech: "名詞",
    meanings: ["人工智能", "AI"],
    examples: [
      {
        japanese: "AIを使ったサービスが増えています。",
        kana: "エーアイをつかったサービスがふえています。",
        chinese: "使用 AI 的服务正在增加。",
      },
    ],
    aiNote: "NHK 和商业新闻都会频繁使用，也常与「人工知能」并列出现。",
    savedAt: "04/25",
    reviewCount: 2,
  },
  growth: {
    id: "growth",
    surface: "成長",
    reading: "せいちょう",
    romaji: "seichou",
    level: "N3",
    partOfSpeech: "名詞",
    meanings: ["成长", "增长"],
    examples: [
      {
        japanese: "経済成長が続いています。",
        kana: "けいざいせいちょうがつづいています。",
        chinese: "经济增长仍在持续。",
      },
    ],
    aiNote: "既可以说人的成长，也常用于经济、市场和企业增长。",
    savedAt: "04/24",
    reviewCount: 1,
  },
  environment: {
    id: "environment",
    surface: "環境",
    reading: "かんきょう",
    romaji: "kankyou",
    level: "N3",
    partOfSpeech: "名詞",
    meanings: ["环境", "自然环境"],
    examples: [
      {
        japanese: "環境を守る取り組みが必要です。",
        kana: "かんきょうをまもるとりくみがひつようです。",
        chinese: "需要保护环境的举措。",
      },
    ],
    aiNote: "既可指自然环境，也可指工作或生活环境，需要看上下文。",
    savedAt: "04/23",
    reviewCount: 1,
  },
  society: {
    id: "society",
    surface: "社会",
    reading: "しゃかい",
    romaji: "shakai",
    level: "N4",
    partOfSpeech: "名詞",
    meanings: ["社会", "社会环境"],
    examples: [
      {
        japanese: "社会問題について話し合いました。",
        kana: "しゃかいもんだいについてはなしあいました。",
        chinese: "大家讨论了社会问题。",
      },
    ],
    aiNote: "「社会に出る」是高频表达，意思是进入职场或正式步入社会。",
    savedAt: "04/22",
    reviewCount: 3,
  },
};

const fallbackVocabularyByCategory: Record<ConcreteArticleCategory, readonly string[]> = {
  科技: ["technique", "ai"],
  经济: ["growth"],
  环境: ["environment"],
  体育: ["society"],
  文化: ["society"],
  政治: ["society"],
};

function dedupe<T>(items: T[]) {
  return [...new Set(items)];
}

export function getVocabularyById(wordId: string) {
  const word = vocabularyCatalog[wordId];

  if (!word) {
    throw new Error(`Unknown vocabulary id: ${wordId}`);
  }

  return word;
}

export function chooseVocabularyIds(text: string, category: ConcreteArticleCategory) {
  const directMatches = Object.values(vocabularyCatalog)
    .filter((item) => text.includes(item.surface))
    .map((item) => item.id);

  if (/(?:AI|人工知能)/i.test(text)) {
    directMatches.push("ai");
  }

  const fallback = fallbackVocabularyByCategory[category] ?? [];
  return dedupe([...directMatches, ...fallback]).slice(0, 3);
}
