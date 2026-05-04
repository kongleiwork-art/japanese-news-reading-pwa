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
  getLearningStats,
  isArticleSaved,
  isWordSaved,
  readLearningState,
  recordArticleRead,
  recordReviewResult,
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
writeLearningState(createEmptyLearningState());

toggleSavedArticle(article);
toggleSavedArticle(article);
toggleSavedArticle(article);
assert.equal(isArticleSaved(readLearningState(), article.id), true);
assert.equal(readLearningState().savedArticleIds.length, 1);

toggleSavedWord(article, word);
toggleSavedWord(article, word);
toggleSavedWord(article, word);
let state = readLearningState();
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

const stats = getLearningStats(state, new Date("2026-04-29T12:00:00.000Z"));
assert.equal(stats.readArticleCount, 1);
assert.equal(stats.savedArticleCount, 1);
assert.equal(stats.savedWordCount, 1);
assert.equal(stats.dueReviewCount, 0);
assert.equal(stats.totalReviewCount, 1);

assert.equal(typeof storage.get(STORAGE_KEY), "string");
console.log("learning-state smoke passed");
