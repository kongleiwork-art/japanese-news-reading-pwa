---
name: frontend-pwa-ui-qa
description: Audit and stabilize mobile-first PWA frontends during high-fidelity UI implementation, interaction debugging, and pre-launch acceptance. Use when Codex is polishing a React/Next.js app against design mocks, fixing modal or route-state regressions, aligning navigation and button states, standardizing mobile container behavior, or turning a fragile prototype into a stable App-Store-quality frontend.
---

# Frontend PWA UI QA

## Overview

Use this skill to harden mobile-first PWA frontends after visual implementation has started and interaction bugs begin to appear. Favor stable, reviewable state flows over flashy but brittle client-only interactions.

## Workflow

### 1. Normalize the acceptance surface

- Treat the app as a finite set of route and state combinations, not just a few screens.
- Enumerate the key URLs before editing, including:
  - default pages
  - tab/channel/filter states
  - modal states
  - flipped/expanded/selected states
- For mobile prototypes, verify every screen inside one consistent app-width container.

Read `references/qa-checklist.md` before large acceptance passes.

### 2. Fix data and route integrity first

- Repair broken routes, missing detail pages, and inconsistent data mappings before polishing visuals.
- Ensure every clickable card, tab, and chip resolves to a valid route or in-page anchor.
- If a list item appears on the homepage, its detail page must exist and render successfully.
- Keep labels and enum values in one canonical data layer to avoid UI drift.

### 3. Prefer URL-driven UI state for fragile interactions

- When local browser or in-app browser environments behave inconsistently, move critical state into the URL.
- Good candidates:
  - modal detail state via `?word=...`
  - card face state via `?side=back`
  - channel/filter state via query params
- Keep close and back behavior explicit and reversible.
- Use client-only toggles only when failure is low-risk and the interaction is already proven stable.

Read `references/failure-modes.md` when modals, drawers, or flip cards behave inconsistently.

### 4. Standardize interactive components

- Remove fake controls. Every control must be one of:
  - real navigation
  - real state change
  - clearly decorative and not styled like a button
- Convert no-op header actions into meaningful internal navigation when product behavior is not implemented yet.
- Keep bottom navigation labels, selected states, and destinations consistent across all pages.

### 5. Validate runtime, not just source

- Run lint and type checks after structural edits.
- Reload the local app and verify rendered HTML or browser state for each critical route.
- Confirm:
  - HTTP 200 for expected pages
  - selected tab/filter states
  - modal/detail visibility through route state
  - back/close links return to the correct base page

### 6. Polish only after stability

- After the state model is reliable, refine spacing, hierarchy, and component consistency.
- For App-Store-quality polish, focus on:
  - consistent container width
  - typography hierarchy
  - button affordance
  - shadow/radius consistency
  - fixed footer and modal layering

## Debugging rules

- If a modal “does not open,” test whether rendering is broken or whether state never changed.
- If a UI works in code but not in the in-app browser, suspect:
  - stale dev server bundle
  - parent `overflow` clipping
  - fixed-position layering
  - unstable client-only interaction state
- If text appears garbled, fix the source data layer instead of patching labels one by one.
- If acceptance finds many tiny issues, pause and unify the shared component or data source rather than doing page-local band-aids.

## Deliverables

When using this skill, produce both:

- a concise acceptance summary
- code or docs that encode the stabilized rules so the same bug class does not return

## References

- Acceptance checklist: `references/qa-checklist.md`
- Common failure modes and remediation patterns: `references/failure-modes.md`
