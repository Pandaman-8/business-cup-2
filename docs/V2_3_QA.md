# V2.3 — QA and release record

Date: November 14, 2026. Branch: `codex/shiftmargin-v2-3`. Baseline main `5b407e5e29e73921745228351bda0a81771232ea`; baseline application `cdd85873771b01e466fbcbf559edd860a2dd3c22`.

## Automated checks actually run

- Phase A: **88 tests passed in 9 files**.
- Phase B and final clean gate: **96 tests passed in 9 files**. All 75 baseline tests retained; expectations for intentional unsaved-change confirmations and the larger capacity were updated. Added 19 trust/app journeys and two identity/capacity tests.
- Final sequence: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` — all passed. Clean install added 106 packages; final test duration 17.82 seconds in this environment.
- No domain engine, worker, adapter, dependency manifest/lockfile or workflow change. Worker remains `optimizer.worker-B-rFU836.js` (9.19 kB).
- Final tested assets: `index-DYkscYhB.js` (289.42 kB / 87.53 kB gzip), `index-cgxdZArw.css` (23.88 kB / 6.03 kB gzip).

During development, older journeys initially stopped at the newly required confirmation. Tests were updated to make that deliberate choice while preserving financial assertions. One run overlapped another suite and hit a 5-second app-test timeout; an isolated full run passed without increasing timeouts. These intermediate failures are not described as clean passes.

## Financial and storage regression

Real optimizer tests retain Sunday **$98.40**, Saturday **$23.20**, two shifts **$121.60**, one-shift difference **$75.20**, missing partner care, independent custom **$85.55**, minimum sitter visits, commute limits, cent rounding and the 1,536-case independent care oracle. The new end-to-end custom case returns **$55.12** only after explicit sitter coverage; provider selection alone returns $0.00 and missing care.

Trust tests cover first/identical/changed Free saves; illustrative-status identity; replacement confirmation; cancel upgrade; save/discard/cancel navigation; reset/new comparison/restore/calendar changes; invalid money drafts; quota failure; corrupt storage; cross-tab Free replacement and deleted library targets; reload warning; duplicate library save; direct next-week reuse and DST rejection. Existing tests retain rename/delete, Demo on/off, reload persistence, blocked storage, conflicting writes, comparison cancellation/late response/failure/retry and dialog focus restoration.

The five-record v1 fixture still reads. Twelve supported-size schedules with ten offers and all care sources at 28 windows serialize to **121,004 characters**, under the retained 500,000-character ceiling. The thirteenth record is rejected. Per-record bounds, malformed versions, duplicate IDs, quota failures and the isolated Free slot remain tested. Browser/device storage quotas vary; no unlimited capacity is claimed.

## Actual local browser checks

The production build was served at `http://127.0.0.1:4174/`, using a fresh local origin rather than the production storage. Initial server startup inside the sandbox failed with EPERM; the loopback server was started with approved permissions and returned HTTP 200. The failed-load browser tab was replaced before testing.

| Flow | Observed result |
| --- | --- |
| Desktop Free, 1440 px | Sample $98.40; first save; repeated identical save showed “This week is already saved” with no dialog. |
| Edited plan | Cap two recalculated $121.60; Reset opened unsaved-change guard; Cancel retained $121.60. |
| Contextual conversion | Second distinct Free save offered Keep both with Plus / Replace / Cancel; simplified pricing and no-charge terms appeared. |
| Mobile Plus, 390 px | Activated Demo, named and saved the second scenario with the Free copy. Library showed 2 of 12 plans. |
| Mobile comparison | Real worker comparison showed $98.40 / $121.60 and $23.20 difference with itemized costs. |
| Keyboard spot check | Escape closed comparison; the rendered DOM marked the original Save this week trigger active afterward. |
| Reload | Demo and both named records remained. |
| Final-build library | DOM inspected at configured widths 375, 390, 768, 1280 and 1440; history and reuse actions remained present. |
| Direct library reuse, 375 px | Advanced Nov 16 to Nov 23, cleared offers, displayed care-reconfirmation reminder. Original saved plans remained. |
| New-comparison guard, 390 px | Leaving the temporary reused week prompted; explicit Discard opened a blank comparison. |
| Independent custom entry, 390 px | Saturday 10:00–14:00 at $31.75/hour, sitter $14/hour, 12.5% withholding, $0 default travel. No availability: $0 and uncovered 10:00–14:00. Explicit full sitter window: $55.12. |
| Console | Error-level log was empty after the completed local history/reuse flow. Browser automation emitted its own transport/network warnings separately. |

See [local DOM evidence](v2-3-evidence/library-mobile-local.txt), [unsaved guard](v2-3-evidence/unsaved-local.txt), [pricing](v2-3-evidence/pricing-local.txt), [comparison](v2-3-evidence/comparison-mobile-local.txt), [reload](v2-3-evidence/reloaded-library-local.txt), [reuse](v2-3-evidence/reuse-375-local.txt), [custom without care](v2-3-evidence/custom-no-care-mobile-local.txt) and [covered custom](v2-3-evidence/custom-covered-mobile-local.txt).

## Verification limits

Browser Playwright-style interactions/evaluation timed out on `Runtime.evaluate`; documented native DOM controls completed the functional journeys. Screenshot capture timed out on `Page.captureScreenshot`. **No fresh V2.3 screenshot was captured.** Earlier V2.2 screenshots are historical only and cannot prove the new copy or controls.

The five-width checks establish rendered DOM/control availability, not measured absence of pixel overflow. A small grid/wrapping change accommodates the added library action, but full visual verification remains open. Complete physical Tab traversal, screen-reader testing, physical phones, cross-browser behavior, native reload-warning display and low-end performance are not certified. The native reload warning is tested through the actual app handler in jsdom; it is not automatic recovery.

No timed trial was implemented, so trial-expiry tests are not applicable. No payment, export/import, cloud sync, account or draft-recovery feature is claimed. Local plan contents may be lost if browser data is cleared. V2.2 rollback with more than five records requires the compatibility precautions in [product decisions](V2_3_PRODUCT_DECISIONS.md).

## Release

Application commit, CI, Pages deployment and post-deployment verification will be recorded after publication. Until that verification completes, V2.2 remains the last verified production release. The earlier V2.2 jury handoff is historical evidence, not a V2.3 deployment claim.
