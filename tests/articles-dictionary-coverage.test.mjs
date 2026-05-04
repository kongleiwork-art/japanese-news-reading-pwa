import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeArticleCoverage,
  buildDictionaryCoverageReport,
  isLocalDictionarySurface,
} from "../src/lib/articles/coverage.ts";

const politics = "\u653f\u6cbb";

function article(input) {
  return {
    id: input.id ?? "fixture-1",
    channel: input.channel ?? "original",
    title: input.title ?? "fixture",
    summary: input.summary ?? "",
    category: politics,
    content: input.content,
  };
}

test("coverage report identifies low coverage articles", () => {
  const report = analyzeArticleCoverage(
    article({
      content: ["\u8a3c\u8a00\u306e\u767a\u8868\u304c\u3042\u308a\u307e\u3057\u305f\u3002"],
    }),
  );

  assert.equal(report.vocabularyCount, 0);
  assert.equal(report.isLowCoverage, true);
  assert.ok(report.candidates.some((candidate) => candidate.surface === "\u8a3c\u8a00"));
});

test("coverage candidates exclude matched local dictionary surfaces", () => {
  const report = analyzeArticleCoverage(
    article({
      content: [
        "AI\u3068\u653f\u5e9c\u306e\u4f1a\u8b70\u3067\u8abf\u67fb\u306b\u3064\u3044\u3066\u8a71\u3057\u307e\u3057\u305f\u3002",
      ],
    }),
  );
  const candidateSurfaces = report.candidates.map((candidate) => candidate.surface);

  assert.deepEqual(report.vocabularyIds, ["ai", "government", "meeting"]);
  assert.equal(isLocalDictionarySurface("AI"), true);
  assert.ok(!candidateSurfaces.includes("AI"));
  assert.ok(candidateSurfaces.includes("\u8abf\u67fb"));
});

test("candidate backlog is sorted by hits, article coverage, then first article", () => {
  const report = buildDictionaryCoverageReport([
    article({
      id: "a",
      content: [
        "\u8abf\u67fb\u3067\u8abf\u67fb\u3068\u8a3c\u8a00\u3092\u78ba\u8a8d\u3057\u307e\u3057\u305f\u3002",
      ],
    }),
    article({
      id: "b",
      content: [
        "\u8a3c\u8a00\u3067\u8abf\u67fb\u3068\u65b0\u3057\u3044\u8a3c\u8a00\u3092\u78ba\u8a8d\u3057\u307e\u3057\u305f\u3002",
      ],
    }),
  ]);

  assert.deepEqual(
    report.candidateBacklog.slice(0, 2).map((candidate) => candidate.surface),
    ["\u8abf\u67fb", "\u8a3c\u8a00"],
  );
  assert.equal(report.candidateBacklog[0].count, 3);
  assert.equal(report.candidateBacklog[0].articleCount, 2);
});

test("coverage vocabulary stays local and does not generate placeholder ids", () => {
  const report = analyzeArticleCoverage(
    article({
      content: [
        "AI\u3068\u653f\u5e9c\u306e\u4f1a\u8b70\u3067\u902e\u6355\u306b\u3064\u3044\u3066\u8a71\u3057\u307e\u3057\u305f\u3002",
      ],
    }),
  );

  assert.ok(report.vocabularyIds.every((id) => !id.startsWith("auto-")));
  assert.ok(report.vocabularyIds.every((id) => !id.startsWith("jisho-")));
});
