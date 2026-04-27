# Frontend PWA Failure Modes

## 1. Client-only modal state is unstable

Symptoms:

- Clicking a word appears to do nothing.
- Modal logic works in code review but not in the in-app browser.
- The same interaction works on one page and fails on another.

Preferred fix:

- Move critical modal state into the URL, such as `?word=technique`.
- Render the modal from route state, not only from transient local state.

## 2. Fixed layer is rendered outside the visible app surface

Symptoms:

- Drawer or modal exists but is clipped, off-canvas, or hidden behind layout layers.
- Desktop browser view stretches a “mobile” page across the full width.

Preferred fix:

- Enforce one mobile container width.
- Remove clipping parents when needed.
- Center modals relative to the mobile canvas, not the browser window assumptions alone.

## 3. Prototype buttons look real but do nothing

Symptoms:

- Header icon buttons are clickable-looking but have no behavior.
- Acceptance feels incomplete even when the UI looks polished.

Preferred fix:

- Replace with real internal navigation or anchors.
- If still decorative, restyle to avoid implying interaction.

## 4. Data enums and labels drift apart

Symptoms:

- Filter labels mismatch route values.
- Cards render but details fail.
- One page uses different text for the same concept.

Preferred fix:

- Centralize categories, channel labels, article metadata, and saved-word data.
- Treat the data layer as the single source of truth.

## 5. Encoding corruption spreads across the app

Symptoms:

- Garbled text appears in source or runtime.
- Small fixes keep re-breaking on other pages.

Preferred fix:

- Rewrite the canonical data and shared components with clean source text.
- Avoid one-off replacements in compiled output or isolated pages.

## 6. Visual polish happens before flow integrity

Symptoms:

- The app looks close to design, but core journeys still break.
- Time is spent on spacing while route-state issues remain unresolved.

Preferred fix:

- Stabilize route matrix, modal state, and navigation first.
- Only then do App-Store-quality spacing and hierarchy refinements.
