import { extractVocabularyCandidates, type VocabularyCandidate } from "./candidates.ts";
import { vocabularyCatalog } from "./vocabulary.ts";
import { findVocabularyIdsInText } from "./tokenizer.ts";
import type { ArticleChannel, ConcreteArticleCategory } from "./types.ts";

export const DEFAULT_LOW_COVERAGE_THRESHOLD = 3;
export const DEFAULT_COVERAGE_CANDIDATE_LIMIT = 12;

export type CoverageArticleInput = {
  id: string;
  channel: ArticleChannel;
  title: string;
  summary?: string;
  category?: ConcreteArticleCategory;
  content: string[];
};

export type ArticleCoverageReport = {
  articleId: string;
  channel: ArticleChannel;
  title: string;
  contentLength: number;
  vocabularyCount: number;
  vocabularyIds: string[];
  isLowCoverage: boolean;
  candidates: VocabularyCandidate[];
};

export type CandidateBacklogItem = {
  surface: string;
  count: number;
  articleCount: number;
  articleIds: string[];
  firstArticleId: string;
  firstArticleTitle: string;
};

export type DictionaryCoverageReport = {
  articles: ArticleCoverageReport[];
  lowCoverageArticles: ArticleCoverageReport[];
  candidateBacklog: CandidateBacklogItem[];
};

const localSurfaceKeys = buildLocalSurfaceKeySet();

export function analyzeArticleCoverage(
  article: CoverageArticleInput,
  options: {
    lowCoverageThreshold?: number;
    candidateLimit?: number;
  } = {},
): ArticleCoverageReport {
  const lowCoverageThreshold =
    options.lowCoverageThreshold ?? DEFAULT_LOW_COVERAGE_THRESHOLD;
  const candidateLimit = options.candidateLimit ?? DEFAULT_COVERAGE_CANDIDATE_LIMIT;
  const text = getArticleSearchText(article);
  const vocabularyIds = findVocabularyIdsInText(text, Object.values(vocabularyCatalog));
  const candidates = extractVocabularyCandidates(text, candidateLimit).filter(
    (candidate) => !isLocalDictionarySurface(candidate.surface),
  );

  return {
    articleId: article.id,
    channel: article.channel,
    title: article.title,
    contentLength: article.content.join("").length,
    vocabularyCount: vocabularyIds.length,
    vocabularyIds,
    isLowCoverage: vocabularyIds.length < lowCoverageThreshold,
    candidates,
  };
}

export function buildDictionaryCoverageReport(
  articles: CoverageArticleInput[],
  options: {
    lowCoverageThreshold?: number;
    candidateLimit?: number;
  } = {},
): DictionaryCoverageReport {
  const articleReports = articles.map((article) => analyzeArticleCoverage(article, options));

  return {
    articles: articleReports,
    lowCoverageArticles: articleReports.filter((article) => article.isLowCoverage),
    candidateBacklog: buildCandidateBacklog(articleReports),
  };
}

export function isLocalDictionarySurface(surface: string) {
  return localSurfaceKeys.has(normalizeSurfaceKey(surface));
}

export function buildCandidateBacklog(articleReports: ArticleCoverageReport[]) {
  const candidates = new Map<
    string,
    CandidateBacklogItem & {
      firstArticleOrder: number;
      firstIndex: number;
      articleIdSet: Set<string>;
    }
  >();

  articleReports.forEach((article, articleOrder) => {
    for (const candidate of article.candidates) {
      const key = normalizeSurfaceKey(candidate.surface);
      const current = candidates.get(key);

      if (current) {
        current.count += candidate.count;
        current.articleIdSet.add(article.articleId);
        current.articleIds = [...current.articleIdSet];
        current.articleCount = current.articleIdSet.size;
        continue;
      }

      candidates.set(key, {
        surface: candidate.surface,
        count: candidate.count,
        articleCount: 1,
        articleIds: [article.articleId],
        firstArticleId: article.articleId,
        firstArticleTitle: article.title,
        firstArticleOrder: articleOrder,
        firstIndex: candidate.firstIndex,
        articleIdSet: new Set([article.articleId]),
      });
    }
  });

  return [...candidates.values()]
    .sort((left, right) => {
      const countDelta = right.count - left.count;
      if (countDelta !== 0) return countDelta;

      const articleCountDelta = right.articleCount - left.articleCount;
      if (articleCountDelta !== 0) return articleCountDelta;

      const articleOrderDelta = left.firstArticleOrder - right.firstArticleOrder;
      if (articleOrderDelta !== 0) return articleOrderDelta;

      const indexDelta = left.firstIndex - right.firstIndex;
      if (indexDelta !== 0) return indexDelta;

      return left.surface.localeCompare(right.surface);
    })
    .map((candidate) => ({
      surface: candidate.surface,
      count: candidate.count,
      articleCount: candidate.articleCount,
      articleIds: candidate.articleIds,
      firstArticleId: candidate.firstArticleId,
      firstArticleTitle: candidate.firstArticleTitle,
    }));
}

function getArticleSearchText(article: CoverageArticleInput) {
  return [article.title, article.summary, ...article.content].filter(Boolean).join("\n");
}

function buildLocalSurfaceKeySet() {
  const surfaces = new Set<string>();

  for (const word of Object.values(vocabularyCatalog)) {
    for (const surface of [word.surface, ...(word.aliases ?? [])]) {
      surfaces.add(normalizeSurfaceKey(surface));
    }
  }

  return surfaces;
}

function normalizeSurfaceKey(surface: string) {
  return surface.trim().replace(/\s+/g, "").toLocaleLowerCase();
}
