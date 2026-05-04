import { toRomaji } from "wanakana";

import type { VocabularyItem } from "./types.ts";

type FetchLike = typeof fetch;

type CacheRecord<T> = {
  expiresAt: number;
  value: T;
};

type LookupOptions = {
  fetcher?: FetchLike;
  now?: () => number;
};

type TranslateOptions = LookupOptions;

type JishoJapanese = {
  word?: string;
  reading?: string;
};

type JishoSense = {
  english_definitions?: string[];
  parts_of_speech?: string[];
};

type JishoEntry = {
  slug?: string;
  is_common?: boolean;
  japanese?: JishoJapanese[];
  senses?: JishoSense[];
};

type JishoResponse = {
  data?: JishoEntry[];
};

const JISHO_SEARCH_URL = "https://jisho.org/api/v1/search/words";
const MYMEMORY_TRANSLATE_URL = "https://api.mymemory.translated.net/get";
const REQUEST_TIMEOUT_MS = 1200;
const LOOKUP_TTL_MS = 24 * 60 * 60 * 1000;
const EMPTY_LOOKUP_TTL_MS = 6 * 60 * 60 * 1000;
const TRANSLATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const lookupCache = new Map<string, CacheRecord<VocabularyItem | null>>();
const translationCache = new Map<string, CacheRecord<string | null>>();

export async function lookupJishoWord(candidate: string, options: LookupOptions = {}) {
  const now = options.now?.() ?? Date.now();
  const cacheKey = normalizeCacheKey(candidate);
  const cached = lookupCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const url = `${JISHO_SEARCH_URL}?keyword=${encodeURIComponent(candidate)}`;
    const response = await fetchWithTimeout(url, options.fetcher, REQUEST_TIMEOUT_MS);

    if (!response.ok) {
      cacheLookup(cacheKey, null, now, EMPTY_LOOKUP_TTL_MS);
      return null;
    }

    const payload = (await response.json()) as JishoResponse;
    const entry = chooseBestJishoEntry(candidate, payload.data ?? []);

    if (!entry) {
      cacheLookup(cacheKey, null, now, EMPTY_LOOKUP_TTL_MS);
      return null;
    }

    const word = toVocabularyItem(candidate, entry);
    cacheLookup(cacheKey, word, now, LOOKUP_TTL_MS);
    return word;
  } catch {
    return null;
  }
}

export async function translateEnglishToChinese(text: string, options: TranslateOptions = {}) {
  const value = text.trim();
  if (!value) return null;

  const now = options.now?.() ?? Date.now();
  const cacheKey = normalizeCacheKey(value);
  const cached = translationCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const url =
      `${MYMEMORY_TRANSLATE_URL}?langpair=en|zh-CN&q=${encodeURIComponent(value)}`;
    const response = await fetchWithTimeout(url, options.fetcher, REQUEST_TIMEOUT_MS);

    if (!response.ok) {
      cacheTranslation(cacheKey, null, now);
      return null;
    }

    const payload = (await response.json()) as {
      responseData?: { translatedText?: string };
    };
    const translated = payload.responseData?.translatedText?.trim() ?? "";
    const result = translated && translated.toLocaleLowerCase() !== value.toLocaleLowerCase()
      ? translated
      : null;

    cacheTranslation(cacheKey, result, now);
    return result;
  } catch {
    return null;
  }
}

export async function enrichVocabularyWithChineseMeanings(
  item: VocabularyItem,
  options: TranslateOptions = {},
) {
  if (item.source !== "jisho" || item.meanings.length === 0) {
    return item;
  }

  const englishMeanings = item.englishMeanings ?? item.meanings;
  const translated = await translateEnglishToChinese(englishMeanings.slice(0, 2).join("; "), options);

  if (!translated) {
    return {
      ...item,
      meanings: englishMeanings.slice(0, 2),
      aiNote: `${item.aiNote} 中文释义暂不可用，已显示英文释义。`,
    };
  }

  return {
    ...item,
    meanings: [translated],
    englishMeanings,
  };
}

export function clearDictionaryApiCaches() {
  lookupCache.clear();
  translationCache.clear();
}

function chooseBestJishoEntry(candidate: string, entries: JishoEntry[]) {
  return entries.find((entry) => isUsefulJishoEntry(candidate, entry)) ?? null;
}

function isUsefulJishoEntry(candidate: string, entry: JishoEntry) {
  const japanese = entry.japanese ?? [];
  const senses = entry.senses ?? [];
  const englishDefinitions = getEnglishDefinitions(entry);
  const hasReading = japanese.some((item) => item.reading);
  const hasCandidateMatch = japanese.some((item) =>
    [item.word, item.reading, entry.slug].some((value) => value === candidate),
  );
  const partsOfSpeech = senses.flatMap((sense) => sense.parts_of_speech ?? []);
  const isProperNounOnly =
    partsOfSpeech.length > 0 &&
    partsOfSpeech.every((part) => part.toLocaleLowerCase().includes("proper noun"));

  return hasReading && hasCandidateMatch && englishDefinitions.length > 0 && !isProperNounOnly;
}

function toVocabularyItem(candidate: string, entry: JishoEntry): VocabularyItem {
  const primaryJapanese =
    entry.japanese?.find((item) => item.word === candidate || item.reading === candidate) ??
    entry.japanese?.[0] ??
    {};
  const surface = primaryJapanese.word ?? entry.slug ?? candidate;
  const reading = primaryJapanese.reading ?? surface;
  const englishMeanings = getEnglishDefinitions(entry).slice(0, 3);
  const partOfSpeech = getPartOfSpeech(entry);

  return {
    id: `jisho-${slugifyVocabularySurface(surface)}`,
    surface,
    aliases: buildAliases(candidate, entry, surface),
    reading,
    romaji: toRomaji(reading),
    level: "N5",
    partOfSpeech,
    meanings: englishMeanings.slice(0, 2),
    englishMeanings,
    examples: [
      {
        japanese: `本文中に「${candidate}」が出ています。`,
        kana: reading,
        chinese: "来自词典 API 的自动词条。",
      },
    ],
    aiNote: "这是 Jisho/JMdict 词典 API 自动补充的词条。",
    savedAt: formatMonthDay(new Date()),
    reviewCount: 0,
    source: "jisho",
    generated: true,
  };
}

function getEnglishDefinitions(entry: JishoEntry) {
  return [
    ...new Set(
      (entry.senses ?? [])
        .flatMap((sense) => sense.english_definitions ?? [])
        .map((definition) => definition.trim())
        .filter(Boolean),
    ),
  ];
}

function getPartOfSpeech(entry: JishoEntry) {
  const partOfSpeech = (entry.senses ?? [])
    .flatMap((sense) => sense.parts_of_speech ?? [])
    .find((part) => part && !part.toLocaleLowerCase().includes("wikipedia definition"));

  return partOfSpeech ?? "词典词条";
}

function buildAliases(candidate: string, entry: JishoEntry, surface: string) {
  return [
    ...new Set(
      [
        candidate,
        entry.slug,
        ...(entry.japanese ?? []).flatMap((item) => [item.word, item.reading]),
      ]
        .filter((value): value is string => Boolean(value?.trim()))
        .filter((value) => value !== surface),
    ),
  ];
}

async function fetchWithTimeout(url: string, fetcher: FetchLike = fetch, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetcher(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "user-agent": "Japanese News Learning PWA",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function cacheLookup(
  key: string,
  value: VocabularyItem | null,
  now: number,
  ttlMs: number,
) {
  lookupCache.set(key, {
    value,
    expiresAt: now + ttlMs,
  });
}

function cacheTranslation(key: string, value: string | null, now: number) {
  translationCache.set(key, {
    value,
    expiresAt: now + TRANSLATION_TTL_MS,
  });
}

function normalizeCacheKey(value: string) {
  return value.trim().toLocaleLowerCase();
}

function slugifyVocabularySurface(surface: string) {
  return Array.from(surface)
    .map((character) => character.codePointAt(0)?.toString(16) ?? "")
    .join("-");
}

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
