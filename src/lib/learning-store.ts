import type { ArticleChannel, ArticleDetail, VocabularyItem } from "@/lib/articles";

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

export type LearningState = {
  savedArticleIds: string[];
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

const emptyState: LearningState = {
  savedArticleIds: [],
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
  return state.savedArticleIds.includes(articleId);
}

export function toggleSavedArticle(article: ArticleDetail) {
  return updateLearningState((state) => {
    const saved = isArticleSaved(state, article.id);

    return {
      ...state,
      savedArticleIds: saved
        ? state.savedArticleIds.filter((id) => id !== article.id)
        : [article.id, ...state.savedArticleIds],
    };
  });
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

  if (due.length > 0) {
    return sortWordsForReview(due);
  }

  return [...state.savedWords]
    .sort((left, right) => Date.parse(right.savedAtIso) - Date.parse(left.savedAtIso))
    .slice(0, 5);
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
    savedArticleCount: state.savedArticleIds.length,
    savedWordCount: state.savedWords.length,
    dueReviewCount: state.savedWords.filter((word) => Date.parse(word.nextReviewAt) <= nowTime)
      .length,
    totalReviewCount: state.reviewRecords.length,
  };
}

export function buildSavedWordId(articleId: string, wordId: string) {
  return `${articleId}:${wordId}`;
}

function normalizeLearningState(value: unknown): LearningState {
  if (!value || typeof value !== "object") {
    return createEmptyLearningState();
  }

  const input = value as Partial<LearningState>;

  return {
    savedArticleIds: uniqueStrings(input.savedArticleIds),
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

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
