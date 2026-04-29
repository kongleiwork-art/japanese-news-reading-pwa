# NHK EASY API Integration Notes

Date: 2026-04-29

## Summary

This round focused on improving the `easy` channel in `src/lib/articles.ts`.
The `original` channel remains backed by TBS NEWS DIG and was not changed.

The main problem was that NHK EASY article pages exposed only truncated summary
content in the unauthenticated Next.js page. The visible HTML also included NHK
ONE usage-confirmation boilerplate, which could leak into article `content`.

The implemented solution follows the same data shape used by
`nhk-news-web-easy/nhk-easy-api`:

- article id
- title
- outline/summary
- body/bodyWithoutHtml equivalent
- URL
- image URL
- published time

Instead of adding a new backend service, the current Next.js app now fetches and
normalizes the complete NHK EASY article body directly inside the existing
article data layer.

## Key Finding

NHK EASY currently has two different server responses for the same article URL:

1. Without NHK ONE anonymous authorization cookies, the server returns a modern
   Next.js page that contains only truncated article text and a usage-confirmation
   panel.
2. With valid anonymous authorization cookies, the server returns the classic
   EASY article HTML. This classic page contains:
   - `<h1 class="article-title">`
   - `<p class="article-date">`
   - `<div class="article-body" id="js-article-body">`
   - full `<p>` body paragraphs
   - `<ruby>` / `<rt>` reading annotations

The second response is the stable source used for full body extraction.

## Implemented Flow

File changed:

- `src/lib/articles.ts`

Current `easy` loading flow:

1. Read the NHK EASY sitemap:
   - `https://news.web.nhk/news/easy/sitemap/sitemap.xml`
2. Select recent EASY article URLs.
3. Build an NHK ONE anonymous authorization cookie header:
   - write a `consentToUse` cookie payload
   - call `https://www.web.nhk/tix/build_authorize`
   - follow redirects manually
   - collect cookies including `z_at`, `authz_type`, `area_permanent`, and token
     expiry cookies
4. Fetch each EASY article URL with the collected cookie header.
5. Parse the classic EASY HTML when available:
   - title from `.article-title`
   - published time from `.article-date`
   - full paragraphs from `#js-article-body`
   - image from `og:image`
6. Strip ruby reading annotations from body text:
   - remove `<rt>` and `<rp>`
   - then normalize remaining HTML text
7. Preserve the existing normalized return contracts:
   - `listArticlePreviews`
   - `getArticleDetail`
   - `listStandardizedArticles`
   - `getStandardizedArticleDetail`

If the anonymous authorization path fails, the loader falls back to the previous
unauthorized HTML parsing path so the `easy` channel still returns usable data.

## Important Code Points

New helper concepts in `src/lib/articles.ts`:

- `EasyConsentArea`
- `NHK_EASY_AUTHORIZATION_URL`
- `NHK_EASY_DEFAULT_AREA`
- `createEasyAuthorizedCookieHeader`
- `mergeCookieJar`
- `serializeCookieJar`
- `extractEasyClassicTitle`
- `extractEasyClassicContent`
- `extractEasyClassicSummary`
- `parseEasyClassicPublishedAt`
- `extractEasyArticleData`

The parsing entry point for `easy` is now `extractEasyArticleData`. It chooses
the classic full-body parser when `#js-article-body` exists, otherwise it falls
back to the previous summary-based parser.

## Validation Completed

These checks passed after the implementation:

```powershell
npm.cmd run lint
npm.cmd run build
```

The dev server was also restarted on:

```text
http://localhost:3100
```

Most recent successful startup used the helper script:

```powershell
start-dev-3100.cmd
```

The server listened on port `3100` and Next.js reported `Ready`.

## Runtime Notes

The first request after a server restart can be slow because both channels load
live remote content and `easy` fetches multiple NHK article pages. Subsequent
requests use the in-memory promise cache:

```ts
const ARTICLES_CACHE_TTL_MS = 10 * 60 * 1000;
```

During testing, first-hit `/` or `/api/articles` requests could take tens of
seconds while live NHK and TBS content was fetched.

## Local Startup Notes

The helper script created in the project root is:

```text
start-dev-3100.cmd
```

It runs:

```cmd
"C:\Program Files\nodejs\npm.cmd" run dev -- --port 3100
```

and writes logs to:

```text
.next-dev-restart.log
.next-dev-restart.err.log
```

In this environment, starting Next.js may require running outside the sandbox
because Next creates child processes and can otherwise fail with:

```text
Error: spawn EPERM
```

## Known Risks

- The NHK ONE anonymous authorization flow is not an official public API. If NHK
  changes the token flow or cookie names, the app will fall back to the previous
  partial parser.
- `top-list.json` and `news-list.json` currently return `401 missing_token`
  without an Authorization header, so they are not used as the primary source.
- First-load latency is still high because remote articles are fetched live.
- The category classifier still uses keyword heuristics inherited from the
  previous implementation.

## Suggested Follow-Ups

1. Cache the NHK anonymous cookie header separately until its expiry time.
2. Limit live article detail fetch concurrency if NHK throttling appears.
3. Add a lightweight debug route or server log for parser mode:
   - `classic`
   - `fallback`
4. Add unit tests for:
   - classic EASY body extraction
   - ruby stripping
   - published date parsing
5. Consider persisting fetched articles later, so the UI is not dependent on
   live NHK/TBS latency on every cold server start.
