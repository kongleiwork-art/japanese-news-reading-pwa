import assert from "node:assert/strict";
import test from "node:test";

import { segmentTextWithVocabulary } from "../src/lib/articles/tokenizer.ts";

test("segmenter trims grammar tails from surface-prefixed aliases", () => {
  const occurrenceWord = {
    id: "occurrence",
    surface: "発生",
    aliases: ["発生から", "発生した"],
    reading: "はっせい",
    romaji: "hassei",
    level: "N3",
    partOfSpeech: "名詞",
    meanings: ["发生"],
    examples: [],
    aiNote: "",
    savedAt: "5/2",
    reviewCount: 0,
  };

  assert.deepEqual(segmentTextWithVocabulary("発生から1時間がたちました。", [occurrenceWord]), [
    { type: "word", value: "発生", wordId: "occurrence", surface: "発生" },
    { type: "text", value: "から1時間がたちました。" },
  ]);

  assert.deepEqual(segmentTextWithVocabulary("発生した火事です。", [occurrenceWord]), [
    { type: "word", value: "発生", wordId: "occurrence", surface: "発生" },
    { type: "text", value: "した火事です。" },
  ]);
});

test("segmenter keeps compound aliases that are not grammar tails", () => {
  const economyWord = {
    id: "economy",
    surface: "経済",
    aliases: ["経済政策"],
    reading: "けいざい",
    romaji: "keizai",
    level: "N3",
    partOfSpeech: "名詞",
    meanings: ["经济"],
    examples: [],
    aiNote: "",
    savedAt: "5/2",
    reviewCount: 0,
  };

  assert.deepEqual(segmentTextWithVocabulary("経済政策を発表しました。", [economyWord]), [
    { type: "word", value: "経済政策", wordId: "economy", surface: "経済" },
    { type: "text", value: "を発表しました。" },
  ]);
});
