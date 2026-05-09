# Vercel + Cloudflare China Deployment

This migration keeps the app on Next.js, keeps article persistence on Turso/libSQL, and uses Cloudflare China Network as the mainland China access layer in front of the Vercel deployment.

## Runtime Architecture

- Vercel runs the Next.js app, App Router pages, and API routes.
- Turso/libSQL remains the production article database.
- GitHub Actions keeps running the scheduled crawler every two hours.
- Cloudflare China Network handles mainland China traffic, WAF, TLS, and acceleration for the Alibaba Cloud registered domain.
- Tencent Cloud deployment is retained only as a manual workflow fallback.

## Branch Strategy

Keep `main` on the existing Tencent Cloud production deployment while this migration stays on `codex/vercel-cloudflare-china-migration` for Vercel preview testing. Do not merge this branch into `main` until the Vercel preview, Turso data flow, Cloudflare China Network routing, and domain cutover have all been verified.

## Vercel Project Setup

Import the GitHub repository into Vercel and keep the default Next.js build settings:

- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: leave unset for Next.js
- Node.js version: `22.x`
- Function region: `hkg1`, configured in `vercel.json`

Set these Vercel environment variables for production and preview:

```text
TURSO_DATABASE_URL=<libsql or Turso database URL>
TURSO_AUTH_TOKEN=<Turso auth token>
```

Optional:

```text
ARTICLES_SQLITE_CACHE_PATH=/tmp/articles.sqlite
```

When `ARTICLES_SQLITE_CACHE_PATH` is not set, the app automatically uses `/tmp/articles.sqlite` on Vercel and `.cache/articles.sqlite` locally.

## GitHub Actions

Keep these repository secrets for the crawler workflow:

```text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
```

The crawler remains in `.github/workflows/crawl.yml` and runs on Node.js 22. The Tencent Cloud deployment workflow is manual-only after this migration, so pushes to `main` should no longer deploy to Tencent Cloud.

## Domain And Cloudflare China

1. Add the Alibaba Cloud domain to the Vercel project.
2. Add any TXT/CNAME records requested by Vercel to prove domain ownership.
3. Complete ICP filing and Cloudflare China Network onboarding for the apex domain.
4. Delegate authoritative DNS as required by Cloudflare China Network.
5. Point the production hostname to the Vercel domain target shown by Vercel.
6. Use TLS mode `Full (strict)`.
7. Keep the same custom hostname configured in Vercel so Host-based routing and certificates work correctly.

Recommended Cloudflare China cache behavior:

- Cache static assets such as `/_next/static/*`, images, fonts, CSS, and JS.
- Bypass cache for `/api/*`.
- Bypass cache for HTML document requests.
- Bypass cache for `/sw.js` and `/manifest.webmanifest`.
- Avoid overriding Vercel response headers for dynamic routes.

Cloudflare China Network requires Enterprise availability and a valid ICP filing for mainland China service. Without that setup, ordinary Cloudflare or ordinary Vercel routing may be slow or unavailable from mainland China.

## Verification Checklist

- `npm run build` passes locally.
- `npm test` passes locally.
- `npm run lint` passes locally.
- Vercel preview loads `/`, `/article/[id]`, and `/api/articles`.
- Production Vercel deployment returns Turso-backed data from `/api/articles`.
- Manual `crawl.yml` run initializes the schema and saves fresh articles.
- Cloudflare China hostname loads the app, article detail pages, `/sw.js`, and `/manifest.webmanifest`.
- `/api/*` responses are not cached by Cloudflare.
- Mainland China network testing confirms the Cloudflare China hostname is reachable.
