# Acceptance tests — execution record

2026-11-14. Automated suite: **26 tests PASS** with `npm test -- --reporter=verbose --silent=false`. `npm run build` PASS (strict TypeScript and Vite production build). Installed dependencies: `npm audit` reports 0 vulnerabilities at installation. GitHub Actions build/test also passed on the first source checkpoint.

| Test name                         | Actual result                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| DEMO_ONE_SHIFT                    | PASS: Sunday $98.40, Saturday $23.20                                               |
| DEMO_TWO_SHIFTS                   | PASS: both $121.60                                                                 |
| PARTNER_UNKNOWN / NO_CARE         | PASS: Sunday rejected with exact 09:00–15:00 gap, Saturday chosen                  |
| CHANGING_RATE / USER_EDIT         | PASS: sitter rate changes real computed costs and recommendation                   |
| NEGATIVE_ALL and ZERO             | PASS: empty set wins                                                               |
| OVERLAP                           | PASS: work and commute overlaps rejected                                           |
| ALREADY_COVERED                   | PASS: overlapping arranged/free care never double billed                           |
| TOUCHING_BOUNDARIES / PARTIAL     | PASS: exact residual intervals and half-open boundaries                            |
| MIN_VISIT: real booking or reject | PASS: two-hour charge requires actual two-hour availability                        |
| MIN_VISIT: extend before need     | PASS: actual prior-hour extension fits availability                                |
| TRAVEL_TIME                       | PASS: care includes commute                                                        |
| CENT_PRECISION                    | PASS: decimal parser and half-up earnings/withholding                              |
| SHIFT_CAP / HOUR_CAP              | PASS: zero and exact boundary                                                      |
| SAME_CARE_UNION                   | PASS: touching shifts share one visit                                              |
| BRIDGING                          | PASS: paid bridge beats separate minimum bookings                                  |
| SEPARATE_VISITS                   | PASS: long free gap makes splitting cheaper                                        |
| NO_SITTER / EMPTY                 | PASS: no invented coverage; empty valid input returns $0                           |
| DETERMINISTIC_TIES                | PASS: stable IDs independent of input ordering                                     |
| OUTSIDE_WEEK                      | PASS: dates, quarter-hour alignment, week-end and commute edges                    |
| DST                               | PASS: US spring/fall rejected, Phoenix allowed                                     |
| INVALID structures                | PASS: malformed inputs cannot enter solver                                         |
| INVALID values                    | PASS: rates, caps, duplicate IDs, dates and household consistency                  |
| UNION                             | PASS: overlapping and touching intervals merge                                     |
| INDEPENDENT_ORACLE                | PASS: 1,536 small cases against exhaustive visit-set enumeration                   |
| INDEPENDENT_SUBSET_ORACLE         | PASS: whole-plan selection matches independent brute force                         |
| PERFORMANCE                       | PASS: all 1,024 subsets; full-week sitter, 10 offers, ~3.7s on development machine |

The stress-case time is a measured observation, not a performance guarantee. Solver runs in a cancellable Web Worker. Typical two-offer fixtures complete in milliseconds. Input edits cancel obsolete calculations; invalid input hides recommendations.

## Browser verification

Using the actual built app and in-app Chromium, not mocked components:

- Sample cap 1 → $98.40; cap 2 → $121.60: PASS.
- Remove partner availability → $23.20; exact uncovered Sunday interval: PASS.
- Blank custom week → add Monday shift, 09:00–13:00, $25.50/hr, $6.25 travel, 10% withholding, explicit partner coverage → **$85.55**: PASS.
- Date input event handling was corrected after browser testing detected a visible change that had not reached React state. Retest verified 4 hours / $102 gross / $85.55 net.
- Three-decimal currency input hides result and produces a validation message: PASS.
- Single-parent mode clears partner care: PASS.
- Desktop landing visual inspection: PASS.
- Final mobile, production and persistence checks: pending release verification below.

## Delivery status

Source is public at https://github.com/Pandaman-8/business-cup-2. GitHub Pages configured for Actions at https://pandaman-8.github.io/business-cup-2/; the initial feature-branch deploy was rejected by the environment's main-only deployment policy. Release uses a normal fast-forward update to main, preserving that policy. Do not treat configuration as deployment evidence; final live verification must be recorded.

Competition submission and pitch PDF are not claimed complete. Captain retains the submission task and deck authoring per the execution directive.
