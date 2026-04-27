# Mobile PWA UI QA Checklist

## Route matrix

Verify at least these states for a content-learning PWA:

- home default
- home alternate channel
- home filtered category
- article detail default
- article detail with modal/query state
- vocabulary page default
- vocabulary page with modal/query state
- review front
- review back
- review back with modal/query state
- profile page

## Component checks

- Bottom navigation highlights the current tab correctly.
- Every primary card click resolves to a working page.
- Filter chips preserve and reflect current selection.
- Header buttons either navigate somewhere real or are visually demoted.
- Fixed footers do not overlap key content or modals.
- Modal close actions return to the correct base route.
- Selected cards or words visibly reflect active state.

## Visual alignment checks

- All pages use the same mobile canvas width.
- Sticky headers, floating footers, and modals align to the same container logic.
- Card radius, shadow, and padding are consistent between pages.
- Japanese content remains readable after Chinese UI localization.
- Primary CTA labels remain visible under real runtime conditions.

## Regression checks

- No homepage card points to a missing detail page.
- No visible label uses stale enum or corrupted source text.
- Query-state URLs are shareable and restorable.
- Review flow still works after modal state is added.
- Empty anchors or no-op buttons are removed or replaced.
