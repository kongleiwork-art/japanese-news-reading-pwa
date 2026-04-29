const baseUrl = process.env.CONTENT_PIPELINE_BASE_URL ?? "http://localhost:3100";

async function fetchJson(path) {
  const response = await fetch(new URL(path, baseUrl));

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return response.json();
}

function assertArticlePreview(article, channel) {
  const missing = ["id", "title", "summary", "source", "publishedAt", "image"].filter(
    (key) => !article[key],
  );

  if (article.channel !== channel) {
    throw new Error(`Expected ${channel} article, got ${article.channel}`);
  }

  if (missing.length > 0) {
    throw new Error(`Article ${article.id ?? "(unknown)"} missing ${missing.join(", ")}`);
  }
}

for (const channel of ["easy", "original"]) {
  const articles = await fetchJson(`/api/articles?channel=${channel}`);

  if (!Array.isArray(articles) || articles.length === 0) {
    throw new Error(`${channel} channel returned no articles`);
  }

  assertArticlePreview(articles[0], channel);

  const detail = await fetchJson(`/api/articles/${encodeURIComponent(articles[0].id)}`);

  if (!Array.isArray(detail.content) || detail.content.length === 0) {
    throw new Error(`${channel} detail ${articles[0].id} returned no content`);
  }
}

const health = await fetchJson("/api/articles/health");

if (!health.sources?.easy || !health.sources?.original) {
  throw new Error("Health route did not return both source states");
}

console.log(`Content pipeline smoke check passed against ${baseUrl}`);
