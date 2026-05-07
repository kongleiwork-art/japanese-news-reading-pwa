import { createClient, type Client } from "@libsql/client";

let articleDbClient: Client | null = null;

export function isArticleDatabaseConfigured() {
  return Boolean(process.env.TURSO_DATABASE_URL);
}

export function getArticleDbClient() {
  const url = process.env.TURSO_DATABASE_URL;

  if (!url) {
    return null;
  }

  if (!articleDbClient) {
    articleDbClient = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  return articleDbClient;
}
