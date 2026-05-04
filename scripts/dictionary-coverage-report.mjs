import { buildDictionaryCoverageReport } from "../src/lib/articles/coverage.ts";
import { lookupJishoWord } from "../src/lib/articles/dictionary-api.ts";
import {
  getArticlePipelineHealth,
  getStandardizedArticleDetail,
  listStandardizedArticles,
} from "../src/lib/articles/pipeline.ts";
import { articleChannels } from "../src/lib/articles/types.ts";

const DEFAULT_JISHO_LIMIT = 12;

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const previews = await listStandardizedArticles(
    options.channel ? { channel: options.channel } : undefined,
  );
  const limitedPreviews = Number.isFinite(options.limit)
    ? previews.slice(0, options.limit)
    : previews;
  const details = (
    await Promise.all(limitedPreviews.map((article) => getStandardizedArticleDetail(article.id)))
  ).filter(Boolean);
  const report = buildDictionaryCoverageReport(details, {
    lowCoverageThreshold: options.threshold,
    candidateLimit: options.candidateLimit,
  });
  const health = getArticlePipelineHealth();
  const jishoNotes = options.withJisho
    ? await buildJishoNotes(report.candidateBacklog.slice(0, options.jishoLimit))
    : new Map();

  printReport(report, {
    threshold: options.threshold,
    withJisho: options.withJisho,
    jishoNotes,
    health,
  });
}

function parseArgs(args) {
  const options = {
    channel: null,
    threshold: 3,
    limit: Number.POSITIVE_INFINITY,
    candidateLimit: 12,
    withJisho: false,
    jishoLimit: DEFAULT_JISHO_LIMIT,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--with-jisho") {
      options.withJisho = true;
      continue;
    }

    const [name, inlineValue] = arg.includes("=") ? arg.split("=", 2) : [arg, null];
    const value = inlineValue ?? args[index + 1];

    if (inlineValue === null && name.startsWith("--")) {
      index += 1;
    }

    switch (name) {
      case "--channel":
        if (!articleChannels.includes(value)) {
          throw new Error(`Invalid --channel value: ${value}. Use easy or original.`);
        }
        options.channel = value;
        break;
      case "--threshold":
        options.threshold = parsePositiveInteger(value, "--threshold");
        break;
      case "--limit":
        options.limit = parsePositiveInteger(value, "--limit");
        break;
      case "--candidate-limit":
        options.candidateLimit = parsePositiveInteger(value, "--candidate-limit");
        break;
      case "--jisho-limit":
        options.jishoLimit = parsePositiveInteger(value, "--jisho-limit");
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function parsePositiveInteger(value, name) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

async function buildJishoNotes(candidates) {
  const notes = new Map();

  for (const candidate of candidates) {
    const word = await lookupJishoWord(candidate.surface);
    if (!word) continue;

    notes.set(
      candidate.surface,
      `${word.reading} | ${word.partOfSpeech} | ${word.meanings.slice(0, 2).join("; ")}`,
    );
  }

  return notes;
}

function printReport(report, options) {
  const articlesByChannel = Map.groupBy(report.articles, (article) => article.channel);

  console.log("Dictionary coverage report");
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log(`Low coverage threshold: vocabularyCount < ${options.threshold}`);
  console.log(`Articles scanned: ${report.articles.length}`);
  console.log("");

  if (report.articles.length === 0) {
    console.log("Source health");
    for (const [channel, health] of Object.entries(options.health.sources)) {
      const error = health.error ? ` | error: ${health.error}` : "";
      console.log(`- ${channel}: ${health.status} | items: ${health.itemCount}${error}`);
    }
    console.log("");
  }

  for (const channel of articleChannels) {
    const articles = articlesByChannel.get(channel) ?? [];
    if (articles.length === 0) continue;

    console.log(`Channel: ${channel}`);
    for (const article of articles) {
      const marker = article.isLowCoverage ? "LOW" : "OK";
      console.log(
        `- ${article.articleId} | ${article.vocabularyCount} words | ${marker} | ${article.title}`,
      );
      console.log(`  matched: ${formatList(article.vocabularyIds)}`);
      console.log(`  candidates: ${formatList(article.candidates.map((item) => item.surface))}`);
    }
    console.log("");
  }

  console.log("Low coverage articles");
  if (report.lowCoverageArticles.length === 0) {
    console.log("- none");
  } else {
    for (const article of report.lowCoverageArticles) {
      console.log(
        `- ${article.channel}/${article.articleId} | ${article.vocabularyCount} words | ${article.title}`,
      );
    }
  }
  console.log("");

  console.log("Candidate backlog");
  if (report.candidateBacklog.length === 0) {
    console.log("- none");
  } else {
    for (const candidate of report.candidateBacklog) {
      console.log(
        `- ${candidate.surface} | ${candidate.count} hits | ${candidate.articleCount} articles | first: ${candidate.firstArticleId} ${candidate.firstArticleTitle}`,
      );
      if (options.withJisho && options.jishoNotes.has(candidate.surface)) {
        console.log(`  jisho: ${options.jishoNotes.get(candidate.surface)}`);
      }
    }
  }
}

function formatList(values) {
  return values.length > 0 ? values.join(", ") : "(none)";
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
