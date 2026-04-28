export type Channel = "easy" | "original";
export type Category =
  | "全部"
  | "科技"
  | "经济"
  | "环境"
  | "体育"
  | "文化"
  | "政治";

export type ArticlePreview = {
  id: string;
  channel: Channel;
  title: string;
  source: string;
  category: Exclude<Category, "全部">;
  summary: string;
  readingMinutes: number;
  publishedAt: string;
  imageStyle: string;
};

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

export type ArticleDetail = ArticlePreview & {
  tagLabel: string;
  content: string[];
  savedWords: VocabularyItem[];
};

export const categories: Category[] = [
  "全部",
  "科技",
  "经济",
  "环境",
  "体育",
  "文化",
  "政治",
];

const vocabularyMap: Record<string, VocabularyItem> = {
  technique: {
    id: "technique",
    surface: "技術",
    reading: "ぎじゅつ",
    romaji: "gijutsu",
    level: "N3",
    partOfSpeech: "名词",
    meanings: ["技术", "技能"],
    examples: [
      {
        japanese: "日本の技術は世界でも高く評価されています。",
        kana: "にほんのぎじゅつはせかいでもたかくひょうかされています。",
        chinese: "日本的技术在世界范围内也受到高度评价。",
      },
      {
        japanese: "新しい技術で生活が便利になりました。",
        kana: "あたらしいぎじゅつでせいかつがべんりになりました。",
        chinese: "新技术让生活变得更方便了。",
      },
    ],
    aiNote:
      "“技術”常用于正式报道，强调体系化能力；在新闻里既可以指核心技术，也可以指技术积累和研发实力。",
    savedAt: "12/15",
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
        japanese: "人工知能の発展が著しい。",
        kana: "じんこうちのうのはってんがいちじるしい。",
        chinese: "人工智能的发展非常显著。",
      },
      {
        japanese: "人工知能を活用したサービス。",
        kana: "じんこうちのうをかつようしたサービス。",
        chinese: "运用人工智能的服务。",
      },
    ],
    aiNote:
      "新闻里会同时出现“人工知能”和“AI”。前者更书面，后者更国际化，也更接近日常媒体表达。",
    savedAt: "12/15",
    reviewCount: 2,
  },
  growth: {
    id: "growth",
    surface: "成長",
    reading: "せいちょう",
    romaji: "seichou",
    level: "N3",
    partOfSpeech: "名词",
    meanings: ["成长", "增长", "发展"],
    examples: [
      {
        japanese: "経済成長が続いています。",
        kana: "けいざいせいちょうがつづいています。",
        chinese: "经济增长仍在持续。",
      },
      {
        japanese: "子どもの成長を見守る。",
        kana: "こどものせいちょうをみまもる。",
        chinese: "守护孩子的成长。",
      },
    ],
    aiNote:
      "“成長”既可以说人的成长，也常用于经济、市场和企业增长，是新闻里非常高频的多义词。",
    savedAt: "04/25",
    reviewCount: 0,
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
      {
        japanese: "働く環境を改善する。",
        kana: "はたらくかんきょうをかいぜんする。",
        chinese: "改善工作环境。",
      },
    ],
    aiNote:
      "“環境”既可以指自然环境，也可以指工作或学习环境，判断时要看新闻上下文。",
    savedAt: "12/13",
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
        japanese: "社会問題について話し合う。",
        kana: "しゃかいもんだいについてはなしあう。",
        chinese: "讨论社会问题。",
      },
      {
        japanese: "社会に出る前に経験を積む。",
        kana: "しゃかいにでるまえにけいけんをつむ。",
        chinese: "在进入社会之前积累经验。",
      },
    ],
    aiNote:
      "“社会に出る”是高频固定表达，意思是进入职场、步入社会，不只是字面上的社会。",
    savedAt: "12/13",
    reviewCount: 6,
  },
};

export const articlePreviews: ArticlePreview[] = [
  {
    id: "ai-lead",
    channel: "easy",
    title: "日本のAI技術、世界をリード",
    source: "NHK EASY",
    category: "科技",
    summary: "日本の人工知能技術が急速に発展し、国際競争力を高めています。",
    readingMinutes: 4,
    publishedAt: "12月15日",
    imageStyle:
      "linear-gradient(160deg, rgba(86,78,63,0.1), rgba(32,25,18,0.55)), radial-gradient(circle at 50% 15%, rgba(255,255,255,0.9), transparent 25%), linear-gradient(180deg, #6f7a87 0%, #57626d 20%, #4b3f34 55%, #2d241f 100%)",
  },
  {
    id: "tokyo-growth",
    channel: "easy",
    title: "東京の経済成長率、3年ぶりに回復",
    source: "NHK EASY",
    category: "经济",
    summary: "東京の経済成長率がコロナ禍以来初めてプラスに転じました。",
    readingMinutes: 5,
    publishedAt: "12月14日",
    imageStyle:
      "linear-gradient(180deg, rgba(255,255,255,0.2), rgba(40,40,40,0.15)), repeating-linear-gradient(90deg, #d9d3cb 0 18px, #c5beb5 18px 24px, #e5e0d9 24px 42px)",
  },
  {
    id: "sports-reform",
    channel: "easy",
    title: "スポーツ庁、学校体育の改革を発表",
    source: "NHK EASY",
    category: "体育",
    summary: "文部科学省は学校体育の新指針を発表しました。",
    readingMinutes: 3,
    publishedAt: "12月12日",
    imageStyle:
      "linear-gradient(180deg, rgba(255,255,255,0.1), rgba(48,47,31,0.35)), linear-gradient(165deg, #b7b7a6 0%, #848d60 40%, #5e5936 100%)",
  },
  {
    id: "climate-policy",
    channel: "original",
    title: "気候変動と日本の環境政策の行方",
    source: "TBS NEWS DIG",
    category: "环境",
    summary: "日本は2050年のカーボンニュートラル達成に向けて環境政策を強化。",
    readingMinutes: 6,
    publishedAt: "12月13日",
    imageStyle:
      "linear-gradient(180deg, rgba(194,212,219,0.1), rgba(40,52,70,0.25)), repeating-linear-gradient(90deg, #7f95a1 0 22px, #677d88 22px 34px, #b7cad2 34px 60px)",
  },
  {
    id: "olympics-impact",
    channel: "original",
    title: "東京五輪の経済効果を再評価",
    source: "TBS NEWS DIG",
    category: "经济",
    summary: "東京オリンピックが日本経済に与えた影響を専門家が分析した。",
    readingMinutes: 7,
    publishedAt: "12月11日",
    imageStyle:
      "linear-gradient(180deg, rgba(255,255,255,0.15), rgba(108,120,134,0.2)), linear-gradient(135deg, #f0f2f4 0%, #d5dbe2 40%, #9ba5b1 100%)",
  },
];

export const articleDetails: Record<string, ArticleDetail> = {
  "ai-lead": {
    ...articlePreviews[0],
    tagLabel: "简单日语",
    content: [
      "日本の人工知能技術が急速に発展しています。",
      "政府は最新の技術を活用して社会課題を解決しようとしています。",
      "研究者たちは、医療・環境・教育など様々な分野での応用を進めています。",
    ],
    savedWords: [vocabularyMap.technique, vocabularyMap.ai],
  },
  "tokyo-growth": {
    ...articlePreviews[1],
    tagLabel: "简单日语",
    content: [
      "東京の経済成長率が3年ぶりに回復しました。",
      "企業の投資意欲が高まり、観光消費も徐々に戻っています。",
      "専門家は、今後も安定した成長が続くか注目しています。",
    ],
    savedWords: [vocabularyMap.growth],
  },
  "sports-reform": {
    ...articlePreviews[2],
    tagLabel: "简单日语",
    content: [
      "スポーツ庁は学校体育の新しい改革案を発表しました。",
      "子どもたちが安全に運動できる環境づくりが重要だとされています。",
      "地域と学校が協力し、授業の質を高める取り組みも始まります。",
    ],
    savedWords: [vocabularyMap.environment],
  },
  "climate-policy": {
    ...articlePreviews[3],
    tagLabel: "实时新闻",
    content: [
      "日本政府は2050年カーボンニュートラル実現に向け、環境政策の見直しを急いでいる。",
      "再生可能エネルギーの導入拡大に加え、産業部門の脱炭素化も大きな課題となる。",
      "社会全体で持続可能な転換を進めるため、制度改革と投資の両輪が求められる。",
    ],
    savedWords: [vocabularyMap.environment, vocabularyMap.society],
  },
  "olympics-impact": {
    ...articlePreviews[4],
    tagLabel: "实时新闻",
    content: [
      "東京五輪の開催が日本経済にもたらした影響について、改めて検証が進められている。",
      "短期的な需要だけでなく、中長期の成長戦略に結び付いたかが焦点となっている。",
      "専門家は、投資の波及効果を社会全体の視点で見直す必要があると指摘した。",
    ],
    savedWords: [vocabularyMap.growth, vocabularyMap.society],
  },
};

export const savedGroups = [
  {
    articleTitle: "東京の経済成長率、3年ぶりに回復",
    countLabel: "1词",
    items: [vocabularyMap.growth],
  },
  {
    articleTitle: "日本のAI技術、世界をリード",
    countLabel: "2词",
    items: [vocabularyMap.technique, vocabularyMap.ai],
  },
  {
    articleTitle: "気候変動と日本の環境政策の行方",
    countLabel: "2词",
    items: [vocabularyMap.environment, vocabularyMap.society],
  },
];

export const reviewQueue = [
  {
    id: vocabularyMap.growth.id,
    source: "来自《東京の経済成長率、3年ぶりに回復》",
    word: vocabularyMap.growth,
  },
  {
    id: vocabularyMap.ai.id,
    source: "来自《日本のAI技術、世界をリード》",
    word: vocabularyMap.ai,
  },
];

export const meStats = [
  { label: "保存单词", value: "5", tone: "amber" },
  { label: "今日待复习", value: "8", tone: "sky" },
  { label: "连续学习", value: "7", tone: "rose" },
  { label: "总复习数", value: "11", tone: "slate" },
] as const;

export const streakCells = [
  "empty",
  "dark",
  "empty",
  "empty",
  "empty",
  "dark",
  "empty",
  "mid",
  "empty",
  "dark",
  "mid",
  "empty",
  "mid",
  "empty",
  "empty",
  "empty",
  "empty",
  "dark",
  "empty",
  "empty",
  "mid",
  "empty",
  "dark",
  "dark",
  "mid",
  "empty",
  "empty",
  "empty",
  "mid",
  "empty",
] as const;
