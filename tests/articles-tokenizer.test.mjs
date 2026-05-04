import assert from "node:assert/strict";
import test from "node:test";

import {
  findVocabularyIdsInText,
  segmentTextWithVocabulary,
} from "../src/lib/articles/tokenizer.ts";
import { chooseVocabularyItems } from "../src/lib/articles/vocabulary.ts";

const words = [
  {
    id: "ai",
    surface: "AI",
    aliases: ["人工知能"],
    reading: "エーアイ",
    romaji: "ee ai",
    level: "N2",
    partOfSpeech: "名詞",
    meanings: ["人工智能"],
    examples: [],
    aiNote: "",
    savedAt: "4/29",
    reviewCount: 0,
  },
  {
    id: "growth",
    surface: "成長",
    aliases: ["経済成長"],
    reading: "せいちょう",
    romaji: "seichou",
    level: "N3",
    partOfSpeech: "名詞",
    meanings: ["增长"],
    examples: [],
    aiNote: "",
    savedAt: "4/29",
    reviewCount: 0,
  },
];

test("segmenter maps aliases to vocabulary ids with longest match first", () => {
  const segments = segmentTextWithVocabulary("人工知能と経済成長が注目されています。", words);

  assert.deepEqual(segments, [
    { type: "word", value: "人工知能", wordId: "ai", surface: "AI" },
    { type: "text", value: "と" },
    { type: "word", value: "経済成長", wordId: "growth", surface: "成長" },
    { type: "text", value: "が注目されています。" },
  ]);
});

test("segmenter matches ascii vocabulary case-insensitively", () => {
  const segments = segmentTextWithVocabulary("aiを使った技術です。", words);

  assert.deepEqual(segments.slice(0, 2), [
    { type: "word", value: "ai", wordId: "ai", surface: "AI" },
    { type: "text", value: "を使った技術です。" },
  ]);
});

test("vocabulary id finder includes surface and alias matches", () => {
  assert.deepEqual(findVocabularyIdsInText("人工知能で成長する", words), ["ai", "growth"]);
});

test("single-kanji vocabulary does not match inside larger kanji names", () => {
  const riverWord = {
    id: "river",
    surface: "川",
    reading: "かわ",
    romaji: "kawa",
    level: "N4",
    partOfSpeech: "名詞",
    meanings: ["河流"],
    examples: [],
    aiNote: "",
    savedAt: "4/29",
    reviewCount: 0,
  };

  assert.deepEqual(findVocabularyIdsInText("旭川市で事件がありました。", [riverWord]), []);
  assert.deepEqual(findVocabularyIdsInText("川で写真を撮りました。", [riverWord]), ["river"]);
});

test("article vocabulary only returns real dictionary matches", () => {
  const items = chooseVocabularyItems("駅前に大きな花が咲きました。", "政治", 4);

  assert.deepEqual(items, []);
  assert.ok(items.every((item) => !item.id.startsWith("auto-")));
});

test("article vocabulary returns matches in first appearance order", () => {
  const text = "政府はAIについて会議で話しました。";
  const items = chooseVocabularyItems(text, "政治", 4);

  assert.deepEqual(
    items.map((item) => item.id),
    ["government", "ai", "meeting"],
  );
});

test("article vocabulary caps matches at 12 words", () => {
  const text =
    "AI、技術、火事、消防、避難、地震、被害、雨、展示、国連、会議、選手、理由、写真について読みました。";
  const items = chooseVocabularyItems(text, "文化");

  assert.equal(items.length, 12);
  assert.deepEqual(
    items.map((item) => item.id),
    [
      "ai",
      "technique",
      "fire",
      "firefighting",
      "evacuation",
      "earthquake",
      "damage",
      "rain",
      "exhibition",
      "united-nations",
      "meeting",
      "athlete",
    ],
  );
});

test("article vocabulary keeps clickable words intentionally limited", () => {
  const text =
    "AI、技術、火事、消防、避難、地震、被害、雨、展示、国連、会議、選手、理由、写真について読みました。";
  const items = chooseVocabularyItems(text, "文化");

  assert.ok(items.length <= 12);
  assert.ok(items.every((item) => item.source === "local" || item.source === undefined));
  assert.ok(items.every((item) => !item.id.startsWith("auto-")));
});
