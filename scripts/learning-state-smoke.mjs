import assert from "node:assert/strict";

const storage = new Map();

globalThis.window = {
  localStorage: {
    getItem(key) {
      return storage.get(key) ?? null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    },
  },
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {},
};

const {
  STORAGE_KEY,
  buildReviewQueue,
  createEmptyLearningState,
  getCurrentStreak,
  getLearningActivity,
  getLearningStats,
  getRecentActivityCells,
  getTodayReviewCount,
  isArticleSaved,
  isWordSaved,
  readLearningState,
  recordArticleRead,
  recordReviewResult,
  removeSavedArticle,
  saveWord,
  toggleSavedArticle,
  toggleSavedWord,
  writeLearningState,
} = await import("../src/lib/learning-store.ts");

const article = {
  id: "article-1",
  channel: "easy",
  title: "テスト記事",
  source: "NHK EASY",
  category: "科技",
  summary: "summary",
  readingMinutes: 3,
  publishedAt: "4月29日",
  image: {
    type: "gradient",
    value: "linear-gradient(#fff,#eee)",
    alt: "テスト記事",
  },
  imageStyle: "linear-gradient(#fff,#eee)",
  tagLabel: "简单日语",
  content: ["新しい技術です。"],
  savedWords: [],
};

const word = {
  id: "technique",
  surface: "技術",
  reading: "ぎじゅつ",
  romaji: "gijutsu",
  level: "N3",
  partOfSpeech: "名词",
  meanings: ["技术"],
  examples: [],
  aiNote: "常见新闻词。",
  savedAt: "4/29",
  reviewCount: 3,
};

assert.deepEqual(readLearningState(), createEmptyLearningState());

writeLearningState({ ...createEmptyLearningState(), savedArticleIds: ["a", "a"] });
assert.deepEqual(readLearningState().savedArticleIds, ["a"]);
assert.deepEqual(readLearningState().savedArticles, []);
writeLearningState(createEmptyLearningState());

toggleSavedArticle(article);
toggleSavedArticle(article);
toggleSavedArticle(article);
let state = readLearningState();
assert.equal(isArticleSaved(state, article.id), true);
assert.equal(state.savedArticleIds.length, 1);
assert.equal(state.savedArticles.length, 1);
assert.equal(state.savedArticles[0].id, article.id);
assert.equal(state.savedArticles[0].title, article.title);
assert.equal(state.savedArticles[0].summary, article.summary);
removeSavedArticle(article.id);
state = readLearningState();
assert.equal(isArticleSaved(state, article.id), false);
assert.equal(state.savedArticleIds.length, 0);
assert.equal(state.savedArticles.length, 0);

toggleSavedWord(article, word);
toggleSavedWord(article, word);
toggleSavedWord(article, word);
state = readLearningState();
assert.equal(isWordSaved(state, article.id, word.id), true);
assert.equal(state.savedWords.length, 1);
assert.equal(state.savedWords[0].reviewCount, 0);
assert.equal(state.savedWords[0].articleId, article.id);
assert.equal(state.savedWords[0].originalWordId, word.id);
assert.equal(state.savedWords[0].surface, word.surface);
assert.equal(state.savedWords[0].id, `${article.id}:${word.id}`);
toggleSavedWord(article, word);
state = readLearningState();
assert.equal(isWordSaved(state, article.id, word.id), false);
assert.equal(state.savedWords.length, 0);

writeLearningState(createEmptyLearningState());
toggleSavedArticle(article);
saveWord(article, word);
saveWord(article, word);
state = readLearningState();
assert.equal(isWordSaved(state, article.id, word.id), true);
assert.equal(state.savedWords.length, 1);
assert.equal(state.savedWords[0].id, `${article.id}:${word.id}`);
writeLearningState({
  ...state,
  savedWords: state.savedWords.map((savedWord) => ({
    ...savedWord,
    savedAtIso: "2026-04-29T10:30:00.000Z",
    nextReviewAt: "2026-04-29T10:30:00.000Z",
  })),
});

recordArticleRead(article, new Date("2026-04-29T10:00:00.000Z"));
recordArticleRead(article, new Date("2026-04-29T11:00:00.000Z"));
state = readLearningState();
assert.equal(state.readHistory.length, 1);
assert.equal(state.readHistory[0].readAt, "2026-04-29T11:00:00.000Z");

const queue = buildReviewQueue(state, new Date("2026-04-29T11:00:00.000Z"));
assert.equal(queue.length, 1);

recordReviewResult(queue[0].id, "good", new Date("2026-04-29T11:00:00.000Z"));
state = readLearningState();
assert.equal(state.savedWords[0].reviewCount, 1);
assert.equal(state.savedWords[0].nextReviewAt, "2026-05-02T11:00:00.000Z");
assert.equal(state.reviewRecords.length, 1);
assert.equal(buildReviewQueue(state, new Date("2026-04-29T12:00:00.000Z")).length, 0);
assert.equal(buildReviewQueue(state, new Date("2026-05-02T11:00:00.000Z")).length, 1);

const stats = getLearningStats(state, new Date("2026-04-29T12:00:00.000Z"));
assert.equal(stats.readArticleCount, 1);
assert.equal(stats.savedArticleCount, 1);
assert.equal(stats.savedWordCount, 1);
assert.equal(stats.dueReviewCount, 0);
assert.equal(stats.totalReviewCount, 1);
assert.equal(getTodayReviewCount(state, new Date("2026-04-29T12:00:00.000Z")), 1);

const activityState = {
  ...createEmptyLearningState(),
  readHistory: [
    {
      articleId: "activity-1",
      channel: "easy",
      title: "活動記事",
      source: "NHK EASY",
      readAt: "2026-05-03T09:00:00.000Z",
    },
  ],
  savedWords: [
    {
      id: "activity-word",
      articleId: "activity-1",
      articleTitle: "活動記事",
      articleSource: "NHK EASY",
      channel: "easy",
      originalWordId: "word",
      surface: "活動",
      reading: "かつどう",
      romaji: "katsudo",
      level: "N3",
      partOfSpeech: "名词",
      meanings: ["活动"],
      examples: [],
      aiNote: "",
      savedAt: "5/4",
      savedAtIso: "2026-05-04T10:00:00.000Z",
      reviewCount: 0,
      nextReviewAt: "2026-05-04T10:00:00.000Z",
    },
  ],
  reviewRecords: [
    {
      wordId: "activity-word",
      rating: "good",
      reviewedAt: "2026-05-04T11:00:00.000Z",
      nextReviewAt: "2026-05-07T11:00:00.000Z",
    },
    {
      wordId: "activity-word",
      rating: "easy",
      reviewedAt: "2026-05-05T11:00:00.000Z",
      nextReviewAt: "2026-05-12T11:00:00.000Z",
    },
  ],
};
const activity = getLearningActivity(activityState);
assert.equal(activity.get("2026-05-03"), 1);
assert.equal(activity.get("2026-05-04"), 2);
assert.equal(activity.get("2026-05-05"), 1);
assert.equal(getCurrentStreak(activityState, new Date("2026-05-05T12:00:00.000Z")), 3);

const yesterdayOnlyState = {
  ...createEmptyLearningState(),
  readHistory: [
    {
      articleId: "yesterday-1",
      channel: "easy",
      title: "昨日記事",
      source: "NHK EASY",
      readAt: "2026-05-03T09:00:00.000Z",
    },
    {
      articleId: "yesterday-2",
      channel: "easy",
      title: "昨日記事二",
      source: "NHK EASY",
      readAt: "2026-05-04T09:00:00.000Z",
    },
  ],
};
assert.equal(getCurrentStreak(yesterdayOnlyState, new Date("2026-05-05T08:00:00.000Z")), 2);

const cells = getRecentActivityCells(activityState, new Date("2026-05-05T12:00:00.000Z"));
assert.equal(cells.length, 30);
assert.equal(cells.at(-3), "mid");
assert.equal(cells.at(-2), "dark");
assert.equal(cells.at(-1), "mid");
assert.equal(cells.some((cell) => cell === "empty"), true);

assert.equal(typeof storage.get(STORAGE_KEY), "string");
console.log("learning-state smoke passed");
