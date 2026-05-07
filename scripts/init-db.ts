import { initializeArticleDatabase } from "../src/lib/db/articles.ts";

async function main() {
  const initialized = await initializeArticleDatabase();

  if (!initialized) {
    throw new Error("TURSO_DATABASE_URL is required to initialize the article database");
  }

  console.log("Article database schema is ready.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
