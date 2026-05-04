import type { VocabularyItem } from "./types.ts";

export type TextSegment =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "word";
      value: string;
      wordId: string;
      surface: string;
    };

type MatchCandidate = {
  wordId: string;
  surface: string;
  value: string;
  emitLength: number;
};

const asciiPattern = /[a-z]/i;
const grammarTailSuffixes = [
  "から",
  "で",
  "に",
  "を",
  "が",
  "は",
  "へ",
  "と",
  "も",
  "の",
  "した",
  "して",
  "された",
  "について",
];

export function segmentTextWithVocabulary(text: string, words: VocabularyItem[]) {
  const candidates = buildMatchCandidates(words);
  const segments: TextSegment[] = [];
  let textBuffer = "";
  let cursor = 0;

  while (cursor < text.length) {
    const match = candidates.find((candidate) => startsWithCandidate(text, cursor, candidate.value));

    if (!match) {
      textBuffer += text[cursor];
      cursor += 1;
      continue;
    }

    if (textBuffer) {
      segments.push({ type: "text", value: textBuffer });
      textBuffer = "";
    }

    segments.push({
      type: "word",
      value: text.slice(cursor, cursor + match.emitLength),
      wordId: match.wordId,
      surface: match.surface,
    });
    cursor += match.emitLength;
  }

  if (textBuffer) {
    segments.push({ type: "text", value: textBuffer });
  }

  return segments;
}

export function findVocabularyIdsInText(text: string, words: VocabularyItem[]) {
  const matches: { id: string; firstIndex: number; matchLength: number }[] = [];

  for (const word of words) {
    const match = findFirstWordMatch(text, word);

    if (match) {
      matches.push({
        id: word.id,
        firstIndex: match.firstIndex,
        matchLength: match.matchLength,
      });
    }
  }

  return matches
    .sort((left, right) => {
      const indexDelta = left.firstIndex - right.firstIndex;
      if (indexDelta !== 0) return indexDelta;

      return right.matchLength - left.matchLength;
    })
    .map((match) => match.id);
}

function buildMatchCandidates(words: VocabularyItem[]) {
  const seen = new Set<string>();
  const candidates: MatchCandidate[] = [];

  for (const word of words) {
    for (const value of getWordMatchValues(word)) {
      const key = `${word.id}:${normalizeCandidateKey(value)}`;

      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        wordId: word.id,
        surface: word.surface,
        value,
        emitLength: getCandidateEmitLength(word.surface, value),
      });
    }
  }

  return candidates.sort((left, right) => {
    const lengthDelta = right.value.length - left.value.length;
    if (lengthDelta !== 0) return lengthDelta;

    return left.value.localeCompare(right.value);
  });
}

function getWordMatchValues(word: VocabularyItem) {
  return [word.surface, ...(word.aliases ?? [])]
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function getCandidateEmitLength(surface: string, value: string) {
  if (value === surface || !value.startsWith(surface)) {
    return value.length;
  }

  const suffix = value.slice(surface.length);
  return grammarTailSuffixes.includes(suffix) ? surface.length : value.length;
}

function startsWithCandidate(text: string, index: number, candidate: string) {
  const value = text.slice(index, index + candidate.length);

  if (isSingleHanCandidate(candidate) && !hasSingleHanBoundary(text, index, candidate.length)) {
    return false;
  }

  if (asciiPattern.test(candidate)) {
    return value.toLocaleLowerCase() === candidate.toLocaleLowerCase();
  }

  return value === candidate;
}

function findFirstWordMatch(text: string, word: VocabularyItem) {
  let firstMatch: { firstIndex: number; matchLength: number } | null = null;

  for (const value of getWordMatchValues(word)) {
    const index = getCandidateIndex(text, value);

    if (index < 0) continue;

    if (
      !firstMatch ||
      index < firstMatch.firstIndex ||
      (index === firstMatch.firstIndex && value.length > firstMatch.matchLength)
    ) {
      firstMatch = {
        firstIndex: index,
        matchLength: value.length,
      };
    }
  }

  return firstMatch;
}

function getCandidateIndex(text: string, candidate: string) {
  if (isSingleHanCandidate(candidate)) {
    return getSingleHanCandidateIndex(text, candidate);
  }

  if (asciiPattern.test(candidate)) {
    return text.toLocaleLowerCase().indexOf(candidate.toLocaleLowerCase());
  }

  return text.indexOf(candidate);
}

function getSingleHanCandidateIndex(text: string, candidate: string) {
  let cursor = text.indexOf(candidate);

  while (cursor >= 0) {
    if (hasSingleHanBoundary(text, cursor, candidate.length)) {
      return cursor;
    }

    cursor = text.indexOf(candidate, cursor + candidate.length);
  }

  return -1;
}

function hasSingleHanBoundary(text: string, index: number, length: number) {
  const previous = index > 0 ? text[index - 1] : "";
  const next = index + length < text.length ? text[index + length] : "";

  return !isHanCharacter(previous) && !isHanCharacter(next);
}

function isSingleHanCandidate(candidate: string) {
  return candidate.length === 1 && isHanCharacter(candidate);
}

function isHanCharacter(value: string) {
  return /\p{Script=Han}/u.test(value);
}

function normalizeCandidateKey(value: string) {
  return asciiPattern.test(value) ? value.toLocaleLowerCase() : value;
}
