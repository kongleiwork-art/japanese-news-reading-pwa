export type VocabularyCandidate = {
  surface: string;
  firstIndex: number;
  count: number;
};

const DEFAULT_CANDIDATE_LIMIT = 40;

const stopWords = new Set([
  "\u3042\u308b",
  "\u3044\u308b",
  "\u3053\u3068",
  "\u3053\u306e",
  "\u3053\u308c",
  "\u3055\u308c\u305f",
  "\u3057\u305f",
  "\u3057\u3066",
  "\u3057\u3066\u3044\u307e\u3059",
  "\u3059\u308b",
  "\u305d\u306e",
  "\u305d\u308c",
  "\u305f\u3081",
  "\u3064\u3044\u3066",
  "\u3067\u3082",
  "\u3067\u3059",
  "\u306a\u3069",
  "\u307e\u3059",
  "\u307e\u3067",
  "\u3082\u306e",
  "\u3088\u3046",
  "\u3088\u308a",
  "の",
  "を",
  "に",
  "へ",
  "で",
  "と",
  "が",
  "は",
  "も",
  "や",
  "から",
  "まで",
  "より",
  "です",
  "ます",
  "ました",
  "する",
  "した",
  "して",
  "いる",
  "ある",
  "れる",
  "られる",
  "こと",
  "もの",
  "ため",
  "よう",
  "これ",
  "それ",
  "この",
  "その",
  "など",
]);

const singleCharacterAllowlist = new Set([
  "妻",
  "夫",
  "母",
  "父",
  "雨",
  "雪",
  "火",
  "川",
  "山",
  "海",
  "薬",
  "水",
  "金",
  "市",
  "町",
  "村",
]);

const compoundSingleKanjiSuffixes = new Set(["\u8005"]);

const kanjiPattern = /\p{Script=Han}/u;
const hiraganaOnlyPattern = /^[\p{Script=Hiragana}\u30fc]+$/u;
const kanaPattern = /[\p{Script=Hiragana}\p{Script=Katakana}ー]/u;
const wordCharacterPattern = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ーA-Za-z]/u;

export function extractVocabularyCandidates(text: string, limit = DEFAULT_CANDIDATE_LIMIT) {
  const counts = new Map<string, VocabularyCandidate>();
  const segments = segmentJapaneseWords(text);

  for (const segment of [...segments, ...buildCompoundSegments(text, segments)]) {
    const surface = normalizeCandidateSurface(segment.surface);

    if (!isUsefulCandidate(surface)) continue;

    const current = counts.get(surface);
    if (current) {
      current.count += 1;
    } else {
      counts.set(surface, {
        surface,
        firstIndex: segment.firstIndex,
        count: 1,
      });
    }
  }

  return [...counts.values()]
    .sort((left, right) => left.firstIndex - right.firstIndex)
    .slice(0, limit);
}

function segmentJapaneseWords(text: string) {
  const segmenter = new Intl.Segmenter("ja", { granularity: "word" });

  return [...segmenter.segment(text)]
    .filter((segment) => segment.isWordLike)
    .map((segment) => ({
      surface: segment.segment,
      firstIndex: segment.index,
    }));
}

function buildCompoundSegments(
  text: string,
  segments: { surface: string; firstIndex: number }[],
) {
  const compounds: { surface: string; firstIndex: number }[] = [];

  for (let index = 0; index < segments.length - 1; index += 1) {
    const left = normalizeCandidateSurface(segments[index].surface);
    const right = normalizeCandidateSurface(segments[index + 1].surface);
    const gap = text.slice(
      segments[index].firstIndex + segments[index].surface.length,
      segments[index + 1].firstIndex,
    );

    if (gap !== "") continue;
    if (!kanjiPattern.test(left) || !kanjiPattern.test(right)) continue;
    if (left.length === 1) continue;
    if (right.length === 1 && !compoundSingleKanjiSuffixes.has(right)) continue;

    const surface = `${left}${right}`;
    if (surface.length < 2 || surface.length > 6) continue;

    compounds.push({
      surface,
      firstIndex: segments[index].firstIndex,
    });
  }

  return compounds;
}

function normalizeCandidateSurface(surface: string) {
  return surface.trim().replace(/\s+/g, "");
}

function isUsefulCandidate(surface: string) {
  if (!surface) return false;
  if (stopWords.has(surface)) return false;
  if (/^\d+$/.test(surface)) return false;
  if (/^[A-Za-z]$/.test(surface)) return false;
  if (!wordCharacterPattern.test(surface)) return false;
  if (surface.length === 1 && !singleCharacterAllowlist.has(surface)) return false;
  if (!kanjiPattern.test(surface) && !kanaPattern.test(surface)) return false;
  if (hiraganaOnlyPattern.test(surface)) return false;
  if (/^[年月日時分秒歳才]+$/.test(surface)) return false;
  if (/^[するしたしてますましたいるあるれるられる]+$/.test(surface)) return false;
  return true;
}
