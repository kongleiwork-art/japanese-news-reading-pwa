const VERSION = "v3";
const STATIC_CACHE = `qingdu-static-${VERSION}`;
const ARTICLE_CACHE = `qingdu-articles-${VERSION}`;
const RUNTIME_CACHE = `qingdu-runtime-${VERSION}`;
const RECENT_ARTICLES_URL = "/__qingdu-offline/recent-articles";
const ARTICLE_LIMIT = 50;
const CACHE_TIME_HEADER = "x-qingdu-cache-time";
const RUNTIME_CACHE_TTL_MS = 60 * 60 * 1000;
const STATIC_URLS = ["/manifest.webmanifest"];
const RUNTIME_PRECACHE_URLS = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .open(STATIC_CACHE)
        .then((cache) => Promise.allSettled(STATIC_URLS.map((url) => cache.add(url)))),
      caches.open(RUNTIME_CACHE).then((cache) =>
        Promise.allSettled(
          RUNTIME_PRECACHE_URLS.map((url) =>
            fetchAndUpdateCache(cache, new Request(new URL(url, self.location.origin))),
          ),
        ),
      ),
    ]).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("qingdu-") &&
                key !== STATIC_CACHE &&
                key !== ARTICLE_CACHE &&
                key !== RUNTIME_CACHE,
            )
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

  if (url.origin === self.location.origin && isHomePageRequest(request, url)) {
    event.respondWith(handleRuntimeCachedRequest(event, RUNTIME_CACHE, RUNTIME_CACHE_TTL_MS));
    return;
  }

  if (url.origin === self.location.origin && url.pathname === "/api/articles") {
    event.respondWith(handleRuntimeCachedRequest(event, RUNTIME_CACHE, RUNTIME_CACHE_TTL_MS));
    return;
  }

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

  const existing = recent.find((item) => item.articleId === payload.articleId);
  const nextRecent = [
    {
      articleId: payload.articleId,
      urls: [articleUrl, apiUrl, imageUrl].filter(Boolean),
      pinned: Boolean(payload.pinned || existing?.pinned),
    },
    ...recent.filter((item) => item.articleId !== payload.articleId),
  ];
  const pinned = nextRecent.filter((item) => item.pinned);
  const unpinned = nextRecent.filter((item) => !item.pinned);
  const kept = [...pinned, ...unpinned.slice(0, ARTICLE_LIMIT)];
  const keptIds = new Set(kept.map((item) => item.articleId));
  const evicted = nextRecent.filter((item) => !keptIds.has(item.articleId));

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

async function handleRuntimeCachedRequest(event, cacheName, ttlMs) {
  const request = event.request;
  const cache = await caches.open(cacheName);
  const cacheKey = runtimeCacheKey(request);
  const cached = await cache.match(cacheKey);

  if (cached && isFresh(cached, ttlMs)) {
    return cached;
  }

  const refresh = fetchAndCacheRuntimeResponse(event, cache, request, cacheKey);
  event.waitUntil(refresh.catch(() => undefined));

  if (cached) {
    return cached;
  }

  try {
    return await refresh;
  } catch {
    return isHtmlRequest(request)
      ? offlineHomeResponse()
      : new Response("", { status: 503, statusText: "Offline" });
  }
}

async function fetchAndCacheRuntimeResponse(event, cache, request, cacheKey) {
  const response = await fetch(request);

  if (response.ok) {
    event.waitUntil(putTimestampedResponse(cache, cacheKey, response.clone()).catch(() => undefined));
  }

  return response;
}

async function fetchAndUpdateCache(cache, request, cacheKey = request) {
  const response = await fetch(request);

  if (response.ok) {
    await putTimestampedResponse(cache, cacheKey, response.clone());
  }

  return response;
}

async function putTimestampedResponse(cache, request, response) {
  const headers = new Headers(response.headers);
  headers.set(CACHE_TIME_HEADER, String(Date.now()));

  await cache.put(
    request,
    new Response(await response.arrayBuffer(), {
      status: response.status,
      statusText: response.statusText,
      headers,
    }),
  );
}

function isFresh(response, ttlMs) {
  const cachedAt = Number.parseInt(response.headers.get(CACHE_TIME_HEADER) ?? "0", 10);
  return Number.isFinite(cachedAt) && Date.now() - cachedAt < ttlMs;
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
    value.urls.every((url) => typeof url === "string") &&
    (value.pinned === undefined || typeof value.pinned === "boolean")
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

function runtimeCacheKey(request) {
  const url = new URL(request.url);
  url.hash = "";
  return new Request(url.toString());
}

function isHomePageRequest(request, url) {
  return (
    url.pathname === "/" &&
    url.search === "" &&
    request.mode === "navigate" &&
    isHtmlRequest(request)
  );
}

function isHtmlRequest(request) {
  return request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
}

function isStaticAsset(pathname) {
  return (
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/")
  );
}

function offlineHomeResponse() {
  return new Response(
    `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>首页暂时无法打开</title>
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
      <h1>首页还没有离线缓存</h1>
      <p>请恢复网络后再打开轻读日语，首页和文章列表会自动保存到本机缓存。</p>
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
