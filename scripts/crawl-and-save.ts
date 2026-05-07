import { READABLE_POOL_LIMIT } from "../src/lib/articles/config.ts";
import { selectLearningArticles } from "../src/lib/articles/selection.ts";
import { loadEasyArticles, loadNewsWebArticles } from "../src/lib/articles/sources.ts";
import { initializeArticleDatabase, saveSelectedArticles } from "../src/lib/db/articles.ts";

async function main() {
  const initialized = await initializeArticleDatabase();

  if (!initialized) {
    throw new Error("TURSO_DATABASE_URL is required to crawl and save articles");
  }

  const [easyResult, originalResult] = await Promise.all([
    loadEasyArticles(),
    loadNewsWebArticles(),
  ]);

  const easySelected = selectLearningArticles(easyResult.articles, {
    channel: "easy",
    limit: READABLE_POOL_LIMIT,
  });
  const originalSelected = selectLearningArticles(originalResult.articles, {
    channel: "original",
    limit: READABLE_POOL_LIMIT,
  });
  const selectedArticles = [...easySelected, ...originalSelected];

  if (selectedArticles.length === 0) {
    throw new Error("Crawler produced no selectable learning articles");
  }

  await saveSelectedArticles(selectedArticles);

  console.log(
    [
      `Saved ${selectedArticles.length} selected articles.`,
      `easy: ${easySelected.length}/${easyResult.articles.length} selected, ${easyResult.failedItems} failed`,
      `original: ${originalSelected.length}/${originalResult.articles.length} selected, ${originalResult.failedItems} failed`,
    ].join("\n"),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
