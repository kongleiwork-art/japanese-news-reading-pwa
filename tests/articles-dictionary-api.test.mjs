import assert from "node:assert/strict";
import test from "node:test";

import { extractVocabularyCandidates } from "../src/lib/articles/candidates.ts";
import {
  clearDictionaryApiCaches,
  enrichVocabularyWithChineseMeanings,
  lookupJishoWord,
} from "../src/lib/articles/dictionary-api.ts";
import { chooseArticleVocabularyItems } from "../src/lib/articles/vocabulary.ts";

test("candidate extractor keeps useful Japanese news terms in article order", () => {
  const text =
    "旭山動物園で職員を逮捕しました。容疑者は遺体を損壊した疑いで、原爆の展示もありました。";
  const surfaces = extractVocabularyCandidates(text).map((candidate) => candidate.surface);

  assert.ok(surfaces.includes("逮捕"));
  assert.ok(surfaces.includes("容疑者"));
  assert.ok(surfaces.includes("原爆"));
  assert.ok(surfaces.indexOf("逮捕") < surfaces.indexOf("原爆"));
});

test("jisho lookup normalizes a successful dictionary response", async () => {
  clearDictionaryApiCaches();
  const fetcher = async () =>
    new Response(
      JSON.stringify({
        data: [
          {
            slug: "逮捕",
            japanese: [{ word: "逮捕", reading: "たいほ" }],
            senses: [
              {
                english_definitions: ["arrest", "apprehension"],
                parts_of_speech: ["Noun", "Suru verb"],
              },
            ],
          },
        ],
      }),
      { status: 200 },
    );

  const word = await lookupJishoWord("逮捕", { fetcher });

  assert.equal(word?.id, "jisho-902e-6355");
  assert.equal(word?.surface, "逮捕");
  assert.equal(word?.reading, "たいほ");
  assert.equal(word?.romaji, "taiho");
  assert.equal(word?.partOfSpeech, "Noun");
  assert.deepEqual(word?.meanings, ["arrest", "apprehension"]);
  assert.deepEqual(word?.englishMeanings, ["arrest", "apprehension"]);
  assert.equal(word?.source, "jisho");
  assert.equal(word?.generated, true);
});

test("translation success uses Chinese meanings and keeps English fallback data", async () => {
  const word = {
    id: "jisho-902e-6355",
    surface: "逮捕",
    reading: "たいほ",
    romaji: "taiho",
    level: "N5",
    partOfSpeech: "Noun",
    meanings: ["arrest", "apprehension"],
    englishMeanings: ["arrest", "apprehension"],
    examples: [],
    aiNote: "api",
    savedAt: "4/30",
    reviewCount: 0,
    source: "jisho",
    generated: true,
  };
  const fetcher = async () =>
    new Response(
      JSON.stringify({
        responseData: {
          translatedText: "逮捕；拘捕",
        },
      }),
      { status: 200 },
    );

  const enriched = await enrichVocabularyWithChineseMeanings(word, { fetcher });

  assert.deepEqual(enriched.meanings, ["逮捕；拘捕"]);
  assert.deepEqual(enriched.englishMeanings, ["arrest", "apprehension"]);
});

test("translation failure falls back to English meanings", async () => {
  const word = {
    id: "jisho-907a-4f53",
    surface: "遺体",
    reading: "いたい",
    romaji: "itai",
    level: "N5",
    partOfSpeech: "Noun",
    meanings: ["corpse"],
    englishMeanings: ["corpse"],
    examples: [],
    aiNote: "api",
    savedAt: "4/30",
    reviewCount: 0,
    source: "jisho",
    generated: true,
  };
  const fetcher = async () => new Response("{}", { status: 500 });

  const enriched = await enrichVocabularyWithChineseMeanings(word, { fetcher });

  assert.deepEqual(enriched.meanings, ["corpse"]);
  assert.match(enriched.aiNote, /英文释义/);
});

test("article vocabulary stays local-first and does not add live jisho words", async () => {
  clearDictionaryApiCaches();
  const items = await chooseArticleVocabularyItems(
    "政府は逮捕について会議で話しました。",
    "政治",
    4,
  );

  assert.deepEqual(
    items.map((item) => item.id),
    ["government", "arrest", "meeting"],
  );
  assert.ok(items.every((item) => !item.id.startsWith("auto-")));
  assert.ok(items.every((item) => !item.id.startsWith("jisho-")));
});
