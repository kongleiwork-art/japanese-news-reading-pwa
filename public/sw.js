const VERSION = "v1";
const STATIC_CACHE = `qingdu-static-${VERSION}`;
const ARTICLE_CACHE = `qingdu-articles-${VERSION}`;
const RECENT_ARTICLES_URL = "/__qingdu-offline/recent-articles";
const ARTICLE_LIMIT = 10;
const STATIC_URLS = ["/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => Promise.allSettled(STATIC_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("qingdu-") && key !== STATIC_CACHE && key !== ARTICLE_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  const message = event.data;

  if (!message || message.type !== "CACHE_ARTICLE") {
    return;
  }

  event.waitUntil(cacheArticle(message.payload));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin === self.location.origin && /^\/article\/[^/]+$/.test(url.pathname)) {
    event.respondWith(handleArticlePage(request));
    return;
  }

  if (url.origin === self.location.origin && /^\/api\/articles\/[^/]+$/.test(url.pathname)) {
    event.respondWith(networkFirst(request, ARTICLE_CACHE));
    return;
  }

  if (url.origin === self.location.origin && isStaticAsset(url.pathname)) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
  }
});

async function cacheArticle(payload) {
  if (!payload?.articleId || !payload?.articleUrl || !payload?.apiUrl) {
    return;
  }

  const articleCache = await caches.open(ARTICLE_CACHE);
  const recent = await readRecentArticles(articleCache);
  const articleUrl = toSameOriginUrl(payload.articleUrl);
  const apiUrl = toSameOriginUrl(payload.apiUrl);
  const imageUrl = payload.imageUrl ? toAnyUrl(payload.imageUrl) : null;

  if (!articleUrl || !apiUrl) {
    return;
  }

  await Promise.allSettled([
    fetchAndCache(articleCache, articleUrl),
    fetchAndCache(articleCache, apiUrl),
    imageUrl ? fetchAndCache(articleCache, imageUrl, { mode: "no-cors" }) : Promise.resolve(),
  ]);

  const nextRecent = [
    {
      articleId: payload.articleId,
      urls: [articleUrl, apiUrl, imageUrl].filter(Boolean),
    },
    ...recent.filter((item) => item.articleId !== payload.articleId),
  ];
  const kept = nextRecent.slice(0, ARTICLE_LIMIT);
  const evicted = nextRecent.slice(ARTICLE_LIMIT);

  await Promise.all(evicted.flatMap((item) => item.urls.map((url) => articleCache.delete(url))));
  await writeRecentArticles(articleCache, kept);
}

async function handleArticlePage(request) {
  const articleCache = await caches.open(ARTICLE_CACHE);
  const cacheKey = canonicalArticleUrl(request.url);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await articleCache.put(cacheKey, response.clone());
    }

    return response;
  } catch {
    const cached = await articleCache.match(request, { ignoreSearch: true });

    if (cached) {
      return cached;
    }

    return offlineArticleResponse();
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });

    if (cached) {
      return cached;
    }

    return new Response("", { status: 503, statusText: "Offline" });
  }
}

async function fetchAndCache(cache, url, init) {
  const request = new Request(url, init);
  const response = await fetch(request);

  if (response.ok || response.type === "opaque") {
    await cache.put(request, response.clone());
  }
}

async function readRecentArticles(cache) {
  const response = await cache.match(RECENT_ARTICLES_URL);

  if (!response) {
    return [];
  }

  try {
    const data = await response.json();
    return Array.isArray(data) ? data.filter(isRecentArticleEntry) : [];
  } catch {
    return [];
  }
}

async function writeRecentArticles(cache, recent) {
  await cache.put(
    RECENT_ARTICLES_URL,
    new Response(JSON.stringify(recent), {
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    }),
  );
}

function isRecentArticleEntry(value) {
  return (
    value &&
    typeof value.articleId === "string" &&
    Array.isArray(value.urls) &&
    value.urls.every((url) => typeof url === "string")
  );
}

function toSameOriginUrl(value) {
  const url = toAnyUrl(value);

  if (!url) {
    return null;
  }

  return new URL(url).origin === self.location.origin ? url : null;
}

function toAnyUrl(value) {
  try {
    return new URL(value, self.location.origin).toString();
  } catch {
    return null;
  }
}

function canonicalArticleUrl(value) {
  const url = new URL(value);
  url.search = "";
  url.hash = "";
  return url.toString();
}

function isStaticAsset(pathname) {
  return (
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/")
  );
}

function offlineArticleResponse() {
  return new Response(
    `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>文章暂时无法离线打开</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f8f4ec;
        color: #49382d;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(360px, calc(100vw - 48px));
        border: 1px solid rgba(92, 70, 48, 0.16);
        border-radius: 24px;
        background: rgba(255, 253, 249, 0.88);
        padding: 28px;
        box-shadow: 0 18px 48px rgba(77, 52, 27, 0.12);
      }
      h1 {
        margin: 0;
        font-size: 24px;
      }
      p {
        margin: 14px 0 0;
        color: #7b6c5c;
        line-height: 1.7;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>这篇文章还没有离线保存</h1>
      <p>联网打开并阅读过的文章会自动保存到最近离线缓存。请恢复网络后再打开这篇文章。</p>
    </main>
  </body>
</html>`,
    {
      status: 503,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}
