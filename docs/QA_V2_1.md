# V2.1 verification

14 November 2026. Baseline `fabf7c4`; isolated branch `codex/shiftmargin-v2-1`. Domain, worker, persistence format, dependency lockfile and deployment workflows are unchanged.

## Engineering

- Before: clean `npm ci`, typecheck, 46 tests, production build pass.
- After: clean `npm ci`, typecheck, 52 tests, production build pass. Final patch verification repeated after refining the zero-limit explanation.
- Existing 30 domain/persistence tests and 1,536 exhaustive oracle cases retained. Six new tests cover visible limits, real rejected-combination reasons, work/commute review, unchanged literal care hours, explicit confirmation, reset and next-week reuse.
- App journeys use the real optimizer through a test worker transport; browser checks use the actual production Web Worker. Its emitted asset remains `optimizer.worker-B-rFU836.js`.
- No new packages. App JS approximately 81.8 kB gzip versus 80.9 kB before; CSS 5.45 kB versus 4.87 kB. No observed typing lag in tested scenarios; no performance benchmark claimed.

## Browser checks

In-app Chromium browser, local production preview:

- Example: Sunday $98.40, Saturday $23.20; two-shift choice $121.60; removing partner care selects Saturday $23.20.
- Editing Sunday's end from 15:00 to 16:00 shows the named care-review message. Existing partner end remains 15:00. Acknowledging without changing availability still selects Saturday $23.20.
- Custom Monday 09:00–13:00, $25.50/hour, explicit partner care, $6.25 travel, 10% estimated withholding: $85.55.
- Partial pay text `25.` survives Quick/Advanced toggling. Saved custom plan restores after reload with $85.55. Moving it to Nov 23 preserves $85.55; next-week reuse clears offers and displays reconfirmation notice.
- Entry and all four steps checked at requested widths 375, 390, 768, 1280 and 1440. Document scroll width equals client width in every case. Native vertical scrollbar uses 15 px of viewport on long screens. No visible button shorter than 44 px in this sweep.
- Real screenshots inspected at mobile and desktop; tablet and larger desktop inspected during final capture. No app console errors observed.

## Accessibility and honest limits

- Native labels, details, buttons, focus outlines and live result announcements retained; new choices expose `aria-pressed`, and care review uses a status announcement.
- Automated keyboard entry/navigation test passes. Physical keyboard and screen-reader audit remain unverified; the embedded browser's Tab simulation was unreliable in V2. No WCAG certification claimed.
- Calculated text contrast: accent on paper 5.78:1, secondary text 5.86:1, primary financial figure 10.95:1, secondary result text 8.70:1. Input/button borders darkened from 2.79:1 to 3.56:1 against white. Reduced-motion rule remains in place.
- Draft autosave deliberately deferred: reload still loses an unsaved plan. Explicit saved-week behavior remains unchanged and privacy copy now names this limitation. Care-review flags are session-only; loading or moving a week already carries a reconfirmation message.
- No user study, conversion uplift, guaranteed savings, or external care confirmation is claimed.

## Before / after

- Before desktop: [V2 baseline](screenshots/v2-1-before-desktop.jpg).
- After desktop: [V2.1 result](screenshots/v2-1-desktop.jpg).
- Before/after mobile: [V2](screenshots/v2-mobile.jpg), [V2.1](screenshots/v2-1-mobile.jpg).
- Custom production flow: [$85.55 on mobile](screenshots/v2-1-custom-mobile.jpg).
- Before/after entry: [V2](screenshots/v2-entry.jpg), [V2.1](screenshots/v2-1-entry.jpg).

Observed workflow change: common one/two-shift selection no longer requires opening a settings disclosure or editing a number. Full-shift care still takes an explicit check and reuses entered work times. Optional hour limits, extended care ranges and financial assumptions remain secondary. Result changes use the existing cancellation and stale-result protection.

## Release

Application release: `e138c57647d5921229df8246782938188ca3d453`, fast-forwarded to main after [branch CI](https://github.com/Pandaman-8/business-cup-2/actions/runs/43590727204) passed.

- [Main CI](https://github.com/Pandaman-8/business-cup-2/actions/runs/43590810478): success.
- [GitHub Pages deployment](https://github.com/Pandaman-8/business-cup-2/actions/runs/43590810480): success.
- [Public production](https://pandaman-8.github.io/business-cup-2/): root HTML serves `index-D5QVqDP0.js` and `index-DkDp6nds.css`; real browser sample verifies $98.40, two-shift $121.60 and missing-partner $23.20. A full custom production flow also returns $85.55; console error log is empty.
- Entry, desktop result and mobile result screenshots were refreshed from the deployed site. Tablet/wide/cost screenshots are from the identical local production build.

A following documentation-only commit records this evidence; no application code changes after the tested release.
