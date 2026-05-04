import type { ConcreteArticleCategory, VocabularyItem } from "./types.ts";
import { localDictionary } from "./dictionary.ts";
import { findVocabularyIdsInText } from "./tokenizer.ts";

const DEFAULT_ARTICLE_VOCABULARY_LIMIT = 12;

export const vocabularyCatalog: Record<string, VocabularyItem> = Object.fromEntries(
  Object.values(localDictionary).map((entry) => [
    entry.id,
    {
      ...entry,
      savedAt: "04/29",
      reviewCount: 0,
      source: "local",
    },
  ]),
) as Record<string, VocabularyItem>;

export function getVocabularyById(wordId: string) {
  const word = vocabularyCatalog[wordId];

  if (!word) {
    throw new Error(`Unknown vocabulary id: ${wordId}`);
  }

  return word;
}

export function chooseVocabularyIds(text: string, category: ConcreteArticleCategory) {
  return chooseVocabularyItems(text, category).map((item) => item.id);
}

export function chooseVocabularyItems(
  text: string,
  _category: ConcreteArticleCategory,
  limit = DEFAULT_ARTICLE_VOCABULARY_LIMIT,
) {
  return findVocabularyIdsInText(text, Object.values(vocabularyCatalog))
    .map(getVocabularyById)
    .slice(0, limit);
}

export async function chooseArticleVocabularyItems(
  text: string,
  category: ConcreteArticleCategory,
  limit = DEFAULT_ARTICLE_VOCABULARY_LIMIT,
) {
  return chooseVocabularyItems(text, category, limit);
}
