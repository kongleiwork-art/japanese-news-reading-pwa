# Backend Handoff

## Current Status

This project is a Next.js app with a unified article normalization layer in
`src/lib/articles.ts`.

Two channels currently exist:

- `easy`: NHK EASY
- `original`: realtime news

The important current state is:

- `original` is no longer using `NHK NEWS WEB`
- `original` has already been switched to `TBS NEWS DIG`
- `easy` still uses the in-project NHK EASY scraping/parsing path
- the next priority is to replace or enhance the `easy` channel with the
  GitHub `nhk-news-web-easy/nhk-easy-api` approach to fix incomplete/missing
  article body parsing

## What Has Been Completed

### 1. Unified article data layer

Main file:

- `src/lib/articles.ts`

This file now powers:

- homepage article list
- article detail page
- standardized API list endpoint
- standardized API detail endpoint

Related API routes:

- `src/app/api/articles/route.ts`
- `src/app/api/articles/[id]/route.ts`

Related pages/components:

- `src/app/page.tsx`
- `src/app/article/[id]/page.tsx`
- `src/components/home-screen.tsx`
- `src/components/article-screen.tsx`

### 2. `original` channel source switch

`original` was previously built around `NHK NEWS WEB`, but that source was
causing a serious body-parsing problem: the page only exposed truncated summary
content in the accessible HTML/API path we tested.

That source has now been replaced with `TBS NEWS DIG`.

Current `original` flow:

- list page: `https://newsdig.tbs.co.jp/list/latest`
- detail page: each article HTML is fetched directly
- normalized fields extracted:
  - title
  - summary
  - publish time
  - source/broadcaster
  - image
  - content paragraphs

Frontend wording was also updated so the channel is presented as:

- `实时新闻`

instead of:

- `原文阅读`

### 3. Validation already completed

These commands passed after the source switch:

```powershell
npm.cmd run lint
npm.cmd run build
```

## Current Problem To Solve Next

The next task is **not** to revisit `original`.

The next task is to improve the `easy` channel by integrating the GitHub NHK
EASY API approach.

Target:

- keep `original = TBS NEWS DIG`
- keep the existing public API shape
- improve only the `easy` source implementation

Main issue:

- NHK EASY article body extraction is still not stable enough
- body text can be incomplete or missing depending on what the current parser
  can recover from the page

## Required Next Step

Use the GitHub project below as the implementation reference:

- `https://github.com/nhk-news-web-easy/nhk-easy-api`

Goal for the next round:

1. Read `src/lib/articles.ts`
2. Keep the `original` channel unchanged unless fixing regressions
3. Replace or enhance the `easy` loading path using the `nhk-easy-api` model
4. Make `easy` reliably return:
   - title
   - summary
   - published time
   - image
   - full body paragraphs
5. Preserve existing return contracts for:
   - `listArticlePreviews`
   - `getArticleDetail`
   - `listStandardizedArticles`
   - `getStandardizedArticleDetail`
6. Run validation again:

```powershell
npm.cmd run lint
npm.cmd run build
```

## Files To Read First

Start here:

- `src/lib/articles.ts`

Then inspect if needed:

- `src/app/api/articles/route.ts`
- `src/app/api/articles/[id]/route.ts`
- `src/components/home-screen.tsx`
- `src/components/article-screen.tsx`

Lower priority / legacy reference only:

- `src/lib/data.ts`

Note:

- `src/lib/data.ts` still contains old mock/demo data remnants
- it is not the main live data path anymore

## Runtime Notes

Local preview was previously run at:

- `http://localhost:3100`

Typical dev command:

```powershell
npm.cmd run dev -- --port 3100
```

## Important Constraints

- Do not revert `original` back to NHK
- Do not break the existing API response shape
- Prioritize `easy` body completeness over further source expansion
- If category mapping for `easy` changes, keep it compatible with existing UI

## Suggested Prompt For The Next Conversation

Use something close to this:

> Please continue this Next.js project. `original` has already been switched
> from NHK NEWS WEB to TBS NEWS DIG in `src/lib/articles.ts`. Do not undo that.
> The next task is to integrate the GitHub `nhk-news-web-easy/nhk-easy-api`
> approach into the `easy` channel so NHK EASY full article body parsing becomes
> stable. Start by reading `src/lib/articles.ts`, keep the current API shape,
> then run `npm run lint` and `npm run build`.
