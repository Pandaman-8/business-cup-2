# ShiftMargin V2 — release verification

## Preserved baseline

- V1 commit: `d7ba231`. V2 developed on `codex/shiftmargin-v2`.
- Baseline: 30 tests passed. No edits to any file in `src/domain/`.
- Before captures: [desktop](screenshots/v1-desktop.jpg), [mobile](screenshots/v1-mobile.jpg).

## Automated checks

`npm ci`, `npm run typecheck`, `npm test`, `npm run build` passed locally. 46 tests across five files, including all original 30 and the existing 1,536-case independent exhaustive care oracle. npm reported zero vulnerabilities at installation.

New coverage: all-source atomic week movement; explicit clear; invalid/DST target rejection; commute-inclusive care presets; comparisons under changed caps; external monetary updates; incomplete monetary drafts; native time input events; complete custom and example flows with the real optimizer; explicit missing care; save/restore; mode switching; home/step draft preservation; ten-offer limit; stale result suppression; correction of invalid what-if values; disclosure remains open after correcting invalid input; keyboard Tab/Enter through entry and into the form with hidden steps excluded.

The App tests substitute only Worker transport in jsdom; the actual optimizer executes unchanged. Browser checks below exercise the real Web Worker.

## Browser verification

In-app Chromium browser; production build on localhost:4173, with requested 1280×900 and 375×812 viewports. The narrow viewport has a 360px content area after its native scrollbar. Both measured document scroll width equal to client width; no horizontal overflow in inspected screens.

- Example opens the result in one click: Sunday $98.40; comparison $75.20 more than Saturday $23.20.
- What-if cap 2: both shifts $121.60; comparison $23.20 more than Sunday. Immediately after editing, old financial output is absent.
- Remove partner: Sunday rejected; Saturday $23.20; missing Sunday hours shown.
- Custom mobile flow: Monday 09:00–13:00, $25.50/hour, explicitly confirmed partner, travel $6.25, withholding assumption 10% → $85.55. No sitter-rate input appears when no sitter is selected.
- Typed `25.` survives Quick/Advanced switching. Native time edits synchronize with the four-hour gross preview ($102.00).
- Choosing a caregiver leaves “No availability confirmed yet” until a full-shift checkbox or actual hours are entered.
- Save succeeds with a visible confirmation; next-week reuse clears shifts and displays a reconfirmation reminder.
- Week-change draft does not move the current schedule. Applying Tuesday Nov 24 is rejected beside the date. Explicitly moving to Monday Nov 23 carries shift and care dates together.
- Invalid pay and ten-offer limit additionally covered in complete DOM interaction tests.

## Accessibility

Native labeled inputs/selects, semantic fieldsets, disclosure summaries, error descriptions, visible focus, 44px+ main controls, live calculation/result announcement, reduced-motion rule. Automated keyboard interaction verifies Tab/Enter and hidden-step exclusion. The embedded browser’s native Tab command did not advance focus, so physical Tab traversal remains unverified; automated DOM keyboard tests passed. This is not a full screen-reader or WCAG conformance audit.

Measured token contrast using WCAG relative luminance:

| Text / background           |   Ratio |
| --------------------------- | ------: |
| Ink / off-white             | 14.13:1 |
| Secondary / off-white       |  5.96:1 |
| Secondary / mint            |  5.56:1 |
| White / primary teal        |  5.39:1 |
| Primary teal / off-white    |  5.20:1 |
| Result teal / mint          |  6.48:1 |
| Error / white               |  7.20:1 |
| Warning text / pale warning |  8.01:1 |

## Before / after

V1 exposes family setup, care windows, shift offers, saving and financial output together. V2 begins with two entry actions; shows one input topic at a time; confirms care using the user's actual shift hours; keeps advanced controls contextual; and leads the result with the selected shift, net money and calculated advantage. This is an observed structural reduction, not a measured conversion or usability improvement from a user study.

## Retained boundaries

Estimates only; user-entered availability is not booking or proof of safe care. One paid provider, 15-minute precision, up to ten offers, no DST-transition weeks. No overtime/benefit/subsidy modeling. One explicit local saved week, no cloud sync or automatic saving. Browser refresh discards unsaved input. Full assistive-technology and real-device testing remains outside this verification.

## Production release

- Application commit: `cbc63ff9a0cf42aa6d0e6c41c7a09151f841898f`.
- [Main CI](https://github.com/Pandaman-8/business-cup-2/actions/runs/43588190026): success.
- [Pages deployment](https://github.com/Pandaman-8/business-cup-2/actions/runs/43588189983): success.
- Stable URL returned the new `index-KDXhakDP.js` build. Browser testing used `?v=cbc63ff` to avoid a cached V1 page.
- Repository metadata confirms public visibility.
- Deployed example: one shift $98.40; cap two $121.60; removing partner selects Saturday $23.20 and rejects Sunday. Fresh custom mobile flow returns $85.55. Browser console errors: none observed.

Production captures for the pitch: [entry](screenshots/v2-entry.jpg), [desktop result](screenshots/v2-desktop.jpg), [mobile result](screenshots/v2-mobile.jpg), [custom mobile result](screenshots/v2-custom-mobile.jpg).
