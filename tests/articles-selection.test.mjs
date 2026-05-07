import { test } from "node:test";
import assert from "node:assert/strict";

import { selectLearningArticles } from "../src/lib/articles/selection.ts";
import { READABLE_POOL_LIMIT } from "../src/lib/articles/config.ts";
import { articleCategories } from "../src/lib/articles/types.ts";
import { vocabularyCatalog } from "../src/lib/articles/vocabulary.ts";

const category = articleCategories[1];

test("selection keeps at most twelve learning articles", () => {
  const selected = selectLearningArticles(
    Array.from({ length: 20 }, (_, index) => createArticle(`easy-${index}`)),
    { channel: "easy", limit: 12 },
  );

  assert.equal(selected.length, 12);
});

test("default selection keeps the readable pool size", () => {
  const selected = selectLearningArticles(
    Array.from({ length: 40 }, (_, index) => createArticle(`pool-${index}`)),
    { channel: "easy" },
  );

  assert.equal(selected.length, READABLE_POOL_LIMIT);
});

test("selection rejects incomplete and low-vocabulary articles", () => {
  const selected = selectLearningArticles(
    [
      createArticle("good"),
      createArticle("empty", { content: [] }),
      createArticle("short", { content: ["短い"] }),
      createArticle("low-vocabulary", { vocabularyIds: ["ai"], savedWords: [vocabularyCatalog.ai] }),
    ],
    { channel: "easy" },
  );

  assert.deepEqual(
    selected.map((article) => article.id),
    ["good"],
  );
});

test("selection can relax vocabulary threshold to fill sparse pools", () => {
  const selected = selectLearningArticles(
    [
      createArticle("primary"),
      createArticle("fallback", {
        vocabularyIds: ["ai", "growth"],
        savedWords: [vocabularyCatalog.ai, vocabularyCatalog.growth],
      }),
    ],
    { channel: "easy", limit: 2 },
  );

  assert.deepEqual(
    selected.map((article) => article.id),
    ["primary", "fallback"],
  );
});

function createArticle(id, overrides = {}) {
  const content = overrides.content ?? [
    "AIと経済についてのニュースです。新しい技術と社会の変化を説明しています。学習者が読みやすい長さで、重要な語彙を何度か確認できます。",
    "政府と企業の取り組みも紹介しています。短すぎる記事ではなく、本文を読んで内容を理解できる量があります。",
    "ニュースの背景と今後の見通しも簡単に書いてあり、復習に使いやすい内容です。",
  ];
  const savedWords = overrides.savedWords ?? [
    vocabularyCatalog.ai,
    vocabularyCatalog.growth,
    vocabularyCatalog.society,
    vocabularyCatalog.government,
  ];

  return {
    id,
    channel: overrides.channel ?? "easy",
    title: overrides.title ?? `記事 ${id}`,
    source: overrides.source ?? "NHK EASY",
    category,
    summary: overrides.summary ?? "学習しやすいニュースです。",
    readingMinutes: 2,
    publishedAt: "5/7",
    publishedAtIso: overrides.publishedAtIso ?? new Date().toISOString(),
    image: {
      type: "gradient",
      value: "linear-gradient(#fff, #eee)",
      alt: "cover",
    },
    imageStyle: "linear-gradient(#fff, #eee)",
    tagLabel: "easy",
    content,
    vocabularyIds: overrides.vocabularyIds ?? savedWords.map((word) => word.id),
    savedWords,
  };
}
