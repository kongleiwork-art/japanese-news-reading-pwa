import type { ArticleChannel, ArticleDetail, ArticleImage, VocabularyItem } from "@/lib/articles";

export const STORAGE_KEY = "qingdu-learning-state-v1";

const CHANGE_EVENT = "qingdu-learning-state-change";

export type ReviewRating = "again" | "hard" | "good" | "easy";

export type SavedWord = VocabularyItem & {
  articleId: string;
  articleTitle: string;
  articleSource: string;
  channel: ArticleChannel;
  originalWordId: string;
  savedAtIso: string;
  nextReviewAt: string;
};

export type ReadHistoryItem = {
  articleId: string;
  channel: ArticleChannel;
  title: string;
  source: string;
  readAt: string;
};

export type ReviewRecord = {
  wordId: string;
  rating: ReviewRating;
  reviewedAt: string;
  nextReviewAt: string;
};

export type SavedArticle = {
  id: string;
  channel: ArticleChannel;
  title: string;
  source: string;
  category: ArticleDetail["category"];
  summary: string;
  readingMinutes: number;
  publishedAt: string;
  image: ArticleImage;
  imageStyle: string;
  savedAtIso: string;
  tagLabel?: string;
  content?: string[];
  savedWords?: VocabularyItem[];
};

export type LearningState = {
  savedArticleIds: string[];
  savedArticles: SavedArticle[];
  savedWords: SavedWord[];
  readHistory: ReadHistoryItem[];
  reviewRecords: ReviewRecord[];
};

export type LearningStats = {
  readArticleCount: number;
  savedArticleCount: number;
  savedWordCount: number;
  dueReviewCount: number;
  totalReviewCount: number;
};

export type ActivityCell = "empty" | "mid" | "dark";

const emptyState: LearningState = {
  savedArticleIds: [],
  savedArticles: [],
  savedWords: [],
  readHistory: [],
  reviewRecords: [],
};

const reviewIntervals: Record<ReviewRating, number> = {
  again: 10 * 60 * 1000,
  hard: 24 * 60 * 60 * 1000,
  good: 3 * 24 * 60 * 60 * 1000,
  easy: 7 * 24 * 60 * 60 * 1000,
};

export function createEmptyLearningState(): LearningState {
  return {
    savedArticleIds: [],
    savedArticles: [],
    savedWords: [],
    readHistory: [],
    reviewRecords: [],
  };
}

export function readLearningState(): LearningState {
  if (typeof window === "undefined") {
    return createEmptyLearningState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalizeLearningState(raw ? JSON.parse(raw) : null);
  } catch {
    return createEmptyLearningState();
  }
}

export function writeLearningState(state: LearningState) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeLearningState(state)));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeLearningState(listener: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function updateLearningState(updater: (state: LearningState) => LearningState) {
  const next = normalizeLearningState(updater(readLearningState()));
  writeLearningState(next);
  return next;
}

export function isArticleSaved(state: LearningState, articleId: string) {
  return (
    state.savedArticleIds.includes(articleId) ||
    state.savedArticles.some((article) => article.id === articleId)
  );
}

export function toggleSavedArticle(article: ArticleDetail, now = new Date()) {
  return updateLearningState((state) => {
    const saved = isArticleSaved(state, article.id);

    return {
      ...state,
      savedArticleIds: saved
        ? state.savedArticleIds.filter((id) => id !== article.id)
        : [article.id, ...state.savedArticleIds],
      savedArticles: saved
        ? state.savedArticles.filter((item) => item.id !== article.id)
        : [
            createSavedArticle(article, now),
            ...state.savedArticles.filter((item) => item.id !== article.id),
          ],
    };
  });
}

export function removeSavedArticle(articleId: string) {
  return updateLearningState((state) => ({
    ...state,
    savedArticleIds: state.savedArticleIds.filter((id) => id !== articleId),
    savedArticles: state.savedArticles.filter((article) => article.id !== articleId),
  }));
}

export function recordArticleRead(article: ArticleDetail, now = new Date()) {
  return updateLearningState((state) => ({
    ...state,
    readHistory: [
      {
        articleId: article.id,
        channel: article.channel,
        title: article.title,
        source: article.source,
        readAt: now.toISOString(),
      },
      ...state.readHistory.filter((item) => item.articleId !== article.id),
    ].slice(0, 100),
  }));
}

export function createSavedWord(
  article: ArticleDetail,
  word: VocabularyItem,
  now = new Date(),
): SavedWord {
  const savedAtIso = now.toISOString();

  return {
    ...word,
    id: buildSavedWordId(article.id, word.id),
    originalWordId: word.id,
    articleId: article.id,
    articleTitle: article.title,
    articleSource: article.source,
    channel: article.channel,
    savedAt: formatMonthDay(now),
    savedAtIso,
    reviewCount: 0,
    nextReviewAt: savedAtIso,
  };
}

export function isWordSaved(state: LearningState, articleId: string, originalWordId: string) {
  return state.savedWords.some(
    (word) => word.articleId === articleId && word.originalWordId === originalWordId,
  );
}

export function toggleSavedWord(article: ArticleDetail, word: VocabularyItem) {
  return updateLearningState((state) => {
    const saved = isWordSaved(state, article.id, word.id);

    return {
      ...state,
      savedWords: saved
        ? state.savedWords.filter(
            (item) => !(item.articleId === article.id && item.originalWordId === word.id),
          )
        : [createSavedWord(article, word), ...state.savedWords],
    };
  });
}

export function saveWord(article: ArticleDetail, word: VocabularyItem) {
  return updateLearningState((state) => {
    if (isWordSaved(state, article.id, word.id)) {
      return state;
    }

    return {
      ...state,
      savedWords: [createSavedWord(article, word), ...state.savedWords],
    };
  });
}

export function removeSavedWord(wordId: string) {
  return updateLearningState((state) => ({
    ...state,
    savedWords: state.savedWords.filter((word) => word.id !== wordId),
    reviewRecords: state.reviewRecords.filter((record) => record.wordId !== wordId),
  }));
}

export function buildReviewQueue(state: LearningState, now = new Date()) {
  const nowTime = now.getTime();
  const due = state.savedWords.filter((word) => Date.parse(word.nextReviewAt) <= nowTime);

  return sortWordsForReview(due);
}

export function recordReviewResult(wordId: string, rating: ReviewRating, now = new Date()) {
  return updateLearningState((state) => {
    const nextReviewAt = new Date(now.getTime() + reviewIntervals[rating]).toISOString();

    return {
      ...state,
      savedWords: state.savedWords.map((word) =>
        word.id === wordId
          ? {
              ...word,
              reviewCount: word.reviewCount + 1,
              nextReviewAt,
            }
          : word,
      ),
      reviewRecords: [
        {
          wordId,
          rating,
          reviewedAt: now.toISOString(),
          nextReviewAt,
        },
        ...state.reviewRecords,
      ].slice(0, 500),
    };
  });
}

export function getLearningStats(state: LearningState, now = new Date()): LearningStats {
  const nowTime = now.getTime();

  return {
    readArticleCount: state.readHistory.length,
    savedArticleCount: getSavedArticleIds(state).length,
    savedWordCount: state.savedWords.length,
    dueReviewCount: state.savedWords.filter((word) => Date.parse(word.nextReviewAt) <= nowTime)
      .length,
    totalReviewCount: state.reviewRecords.length,
  };
}

export function getSavedArticleIds(state: LearningState) {
  return uniqueStrings([
    ...state.savedArticleIds,
    ...state.savedArticles.map((article) => article.id),
  ]);
}

export function getTodayReviewCount(state: LearningState, now = new Date()) {
  const todayKey = formatLocalDateKey(now);

  return state.reviewRecords.filter((record) => toLocalDateKey(record.reviewedAt) === todayKey)
    .length;
}

export function getLearningActivity(state: LearningState) {
  const activity = new Map<string, number>();

  state.readHistory.forEach((item) => addLearningActivity(activity, item.readAt));
  state.savedWords.forEach((word) => addLearningActivity(activity, word.savedAtIso));
  state.reviewRecords.forEach((record) => addLearningActivity(activity, record.reviewedAt));

  return activity;
}

export function getCurrentStreak(state: LearningState, now = new Date()) {
  const activity = getLearningActivity(state);
  const today = startOfLocalDay(now);
  const yesterday = addLocalDays(today, -1);
  const todayKey = formatLocalDateKey(today);
  const yesterdayKey = formatLocalDateKey(yesterday);
  const start = activity.has(todayKey) ? today : activity.has(yesterdayKey) ? yesterday : null;

  if (!start) return 0;

  let streak = 0;
  let cursor = start;

  while (activity.has(formatLocalDateKey(cursor))) {
    streak += 1;
    cursor = addLocalDays(cursor, -1);
  }

  return streak;
}

export function getRecentActivityCells(state: LearningState, now = new Date()): ActivityCell[] {
  const activity = getLearningActivity(state);
  const start = addLocalDays(startOfLocalDay(now), -29);

  return Array.from({ length: 30 }, (_, index) => {
    const date = addLocalDays(start, index);
    const count = activity.get(formatLocalDateKey(date)) ?? 0;

    if (count === 0) return "empty";
    if (count === 1) return "mid";
    return "dark";
  });
}

export function buildSavedWordId(articleId: string, wordId: string) {
  return `${articleId}:${wordId}`;
}

function normalizeLearningState(value: unknown): LearningState {
  if (!value || typeof value !== "object") {
    return createEmptyLearningState();
  }

  const input = value as Partial<LearningState>;
  const savedArticles = Array.isArray(input.savedArticles)
    ? input.savedArticles.filter(isSavedArticle).filter(uniqueById())
    : emptyState.savedArticles;

  return {
    savedArticleIds: uniqueStrings([
      ...uniqueStrings(input.savedArticleIds),
      ...savedArticles.map((article) => article.id),
    ]),
    savedArticles,
    savedWords: Array.isArray(input.savedWords)
      ? input.savedWords.filter(isSavedWord).filter(uniqueById())
      : emptyState.savedWords,
    readHistory: Array.isArray(input.readHistory)
      ? input.readHistory.filter(isReadHistoryItem).filter(uniqueByArticleId())
      : emptyState.readHistory,
    reviewRecords: Array.isArray(input.reviewRecords)
      ? input.reviewRecords.filter(isReviewRecord)
      : emptyState.reviewRecords,
  };
}

function sortWordsForReview(words: SavedWord[]) {
  return [...words].sort((left, right) => {
    const reviewDelta = Date.parse(left.nextReviewAt) - Date.parse(right.nextReviewAt);
    if (reviewDelta !== 0) return reviewDelta;

    return Date.parse(left.savedAtIso) - Date.parse(right.savedAtIso);
  });
}

function uniqueStrings(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string"))]
    : [];
}

function uniqueById<T extends { id: string }>() {
  const seen = new Set<string>();

  return (item: T) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  };
}

function uniqueByArticleId<T extends { articleId: string }>() {
  const seen = new Set<string>();

  return (item: T) => {
    if (seen.has(item.articleId)) return false;
    seen.add(item.articleId);
    return true;
  };
}

function isSavedWord(value: unknown): value is SavedWord {
  if (!value || typeof value !== "object") return false;

  const word = value as Partial<SavedWord>;

  return (
    typeof word.id === "string" &&
    typeof word.articleId === "string" &&
    typeof word.articleTitle === "string" &&
    typeof word.articleSource === "string" &&
    typeof word.originalWordId === "string" &&
    typeof word.surface === "string" &&
    typeof word.reading === "string" &&
    Array.isArray(word.meanings) &&
    typeof word.savedAtIso === "string" &&
    typeof word.nextReviewAt === "string" &&
    typeof word.reviewCount === "number"
  );
}

function isSavedArticle(value: unknown): value is SavedArticle {
  if (!value || typeof value !== "object") return false;

  const article = value as Partial<SavedArticle>;

  return (
    typeof article.id === "string" &&
    (article.channel === "easy" || article.channel === "original") &&
    typeof article.title === "string" &&
    typeof article.source === "string" &&
    typeof article.category === "string" &&
    typeof article.summary === "string" &&
    typeof article.readingMinutes === "number" &&
    typeof article.publishedAt === "string" &&
    isArticleImage(article.image) &&
    typeof article.imageStyle === "string" &&
    typeof article.savedAtIso === "string" &&
    (article.tagLabel === undefined || typeof article.tagLabel === "string") &&
    (article.content === undefined ||
      (Array.isArray(article.content) && article.content.every((item) => typeof item === "string"))) &&
    (article.savedWords === undefined ||
      (Array.isArray(article.savedWords) && article.savedWords.every(isVocabularyItem)))
  );
}

function isReadHistoryItem(value: unknown): value is ReadHistoryItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<ReadHistoryItem>;

  return (
    typeof item.articleId === "string" &&
    (item.channel === "easy" || item.channel === "original") &&
    typeof item.title === "string" &&
    typeof item.source === "string" &&
    typeof item.readAt === "string"
  );
}

function isReviewRecord(value: unknown): value is ReviewRecord {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<ReviewRecord>;

  return (
    typeof item.wordId === "string" &&
    (item.rating === "again" ||
      item.rating === "hard" ||
      item.rating === "good" ||
      item.rating === "easy") &&
    typeof item.reviewedAt === "string" &&
    typeof item.nextReviewAt === "string"
  );
}

function createSavedArticle(article: ArticleDetail, now: Date): SavedArticle {
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
    imageStyle: article.imageStyle,
    savedAtIso: now.toISOString(),
    tagLabel: article.tagLabel,
    content: article.content,
    savedWords: article.savedWords,
  };
}

function isVocabularyItem(value: unknown): value is VocabularyItem {
  if (!value || typeof value !== "object") return false;

  const word = value as Partial<VocabularyItem>;

  return (
    typeof word.id === "string" &&
    typeof word.surface === "string" &&
    typeof word.reading === "string" &&
    typeof word.romaji === "string" &&
    typeof word.partOfSpeech === "string" &&
    Array.isArray(word.meanings) &&
    word.meanings.every((item) => typeof item === "string") &&
    Array.isArray(word.examples) &&
    typeof word.aiNote === "string" &&
    typeof word.savedAt === "string" &&
    typeof word.reviewCount === "number"
  );
}

function isArticleImage(value: unknown): value is ArticleImage {
  if (!value || typeof value !== "object") return false;

  const image = value as Partial<ArticleImage>;

  return (
    (image.type === "gradient" || image.type === "remote") &&
    typeof image.value === "string" &&
    typeof image.alt === "string"
  );
}

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function addLearningActivity(activity: Map<string, number>, value: string) {
  const key = toLocalDateKey(value);
  if (!key) return;

  activity.set(key, (activity.get(key) ?? 0) + 1);
}

function toLocalDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return formatLocalDateKey(date);
}

function formatLocalDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}
