# V2.2 verification record

Date: November 14, 2026. Baseline main `2681e0022fdcc78551824d7b814802ce730eec59`, application `e138c57647d5921229df8246782938188ca3d453`. Feature branch: `codex/shiftmargin-v2-2`.

## Automated gates

- Baseline clean install, typecheck, 52 tests and production build passed before implementation.
- Final clean `npm ci`, `npm run typecheck`, `npm test`, `npm run build`: **75 tests passed in 8 files**. All 52 existing tests retained; 23 added.
- New coverage: 9 storage tests, 12 Free/Plus app journeys, 2 worker-comparison lifecycle tests.
- Covers second-save confirmation, upgrade and two-record save, persisted reload, rename-as-text/XSS, delete/cancel, Demo on/off, real comparison amounts and different-week caveat, corrupt JSON recovery, old schema, duplicate IDs, size/count bounds, blocked storage, activation/save quota failures, five-plan capacity, lost-update detection, other-tab deactivation, focus restoration, late worker responses, cancellation and worker failure/retry.
- Application tests use the real optimizer through a worker transport. The comparison lifecycle tests deliberately deliver late messages but compute their payloads with the real engine. No financial engine mock.
- Retained domain checks include Saturday $23.20, Sunday $98.40, two shifts $121.60, custom $85.55, uncovered care, work/commute overlap, sitter minimum, zero shifts and the independent exhaustive oracle (1,536 cases). Existing adapter/field/app tests retain week transition, partial money text, mode switching, shift limits, care reconfirmation, withholding changes, stale results and Free save/load.
- `git diff --check` passes. No changes to domain files, worker, adapters, dependency manifests/lockfile or CI/deploy workflows.

## Real browser checks

In-app Chromium, production build served locally:

| Flow             | Observed result                                                                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — Free         | Example $98.40; change cap to two gives $121.60; save/replace Free requires explicit confirmation                                                                                                                                           |
| B — Upgrade      | Second save → Keep both with Plus → proposed $5.99/month → no-payment Demo → name and save; Free copy and new scenario appear as two records                                                                                                |
| C — History      | Select both → actual workers return $98.40/$121.60 and $23.20 estimated difference; gross/withholding/care/travel visible; rename works; opening first plan restores $98.40                                                                 |
| D — Return       | Reload retains Demo and both snapshots; renamed record persists; restore first → next week Nov 23 clears offers and moves care; new Sunday Nov 29 09:00–15:00 at $23/h, $12 travel and 20% withholding returns $98.40 after explicit review |
| Demo off         | Library features relock, saved data retained; Free remains usable and Demo can be reopened                                                                                                                                                  |
| E — Corrupt data | Covered in real React/jsdom app integration with corrupt storage, visible error, confirmed clearing and continued Free calculation; **not injected into the browser session**                                                               |

At widths **375, 390, 768, 1280 and 1440**, comparison document scroll width equals viewport width and dialog scroll width equals its client width. Comparison stacks on small phones and uses two columns on tablet/desktop. Pricing and library mobile layouts visually reviewed; primary actions remain usable. Long dialog content scrolls internally; the background is locked. Desktop and mobile screenshots inspected.

An initial local preview process stopped during QA. Comparison correctly displayed failure without partial money values. After restarting the preview and reloading the final build, real workers returned both correct results. This was an environment interruption, not an unresolved application error.

## Accessibility and verification limits

Native modal dialog, labelled heading, labelled inputs, explicit button names, initial heading focus and focus return are implemented. Browser Escape closes the final dialog and returns focus to Plan library; close buttons work. Automated cancellation/focus test passes. Native dialog supplies background inertness and focus containment. Embedded-browser Tab simulation did not advance focus reliably, so a complete physical-keyboard traversal and assistive-technology audit are **not verified**. No WCAG certification claimed.

V2.1 colors/focus outlines are retained; new UI uses the same accent, paper, muted text and soft background. Existing contrast checks and reduced-motion rule are retained; no new animation was introduced. Financial terms use semantic definition lists; async result/error status and labelled comparison region remain readable in DOM inspection. Browser console results and final production evidence are recorded below.

## Performance and remaining limits

Final application asset `index-CUmY9ICS.js`: 285.81 kB / 86.58 kB gzip. CSS `index-CVf5cSEx.css`: 23.81 kB / 6.01 kB gzip. Unchanged worker `optimizer.worker-B-rFU836.js`: 9.19 kB. No added dependencies. No formal low-end-device benchmark claimed.

No critical calculation defect found. Unsaved drafts still disappear on refresh; automatic draft recovery was explicitly deferred to avoid treating partial/invalid money input as a saved plan. Explicit Free/Plus saves persist locally. No payment, server entitlement, account or cloud backup; browser data clearing removes saved plans. Conflict checks detect already-changed storage but are not a transactional cross-tab database. No user study or validated demand/retention evidence.

## Release

Release verification pending at document creation; this section will be updated with actual commit, CI, deployment and public-browser evidence before handoff.
