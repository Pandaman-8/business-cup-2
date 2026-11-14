# Acceptance tests — execution record

2026-11-14. Automated suite: **30 tests PASS** with `npm test -- --reporter=verbose --silent=false`. `npm run build` PASS (strict TypeScript and Vite production build). Installed dependencies: `npm audit` reports 0 vulnerabilities at installation. GitHub Actions build/test also passed on the first source checkpoint.

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

## Public P0 verification (2026-11-14)

GitHub Actions run `43584355016` deployed commit `4876a2d` successfully. Public HTTPS returned HTTP 200 without credentials. A fresh browser navigation to the public URL loaded the complete app without a login. The live sample calculated $98.40, changing the cap calculated $121.60, and removing partner care calculated $23.20. Browser application error log was empty.

At the 375×812 viewport override, document client/scroll widths were both 360px (15px native scrollbar); no horizontal overflow. All input/select controls were wrapped in labels. Mobile rate editing updated Sunday from $98.40 to $132.00. Native Tab key injection did not advance focus in the embedded browser automation; full physical-keyboard traversal is not claimed. Semantic controls and visible CSS focus styling are implemented; a physical-keyboard check remains useful.

## P1 automated tests

| Test            | Result                                                                |
| --------------- | --------------------------------------------------------------------- |
| LOCAL_ROUNDTRIP | PASS: valid saved plan and illustrative label survive                 |
| CORRUPT_STORAGE | PASS: malformed, old, oversized and invalid saved data rejected       |
| NEXT_WEEK       | PASS: care/rates carried forward, offers cleared, original unmodified |
| NEXT_WEEK_DST   | PASS: transition destination rejected                                 |

P1 browser roundtrip and final release verification follow.

P1 browser checks on the built application: **PASS**. Save sample → reload → Load saved week restored $98.40. Reuse advanced Monday to 2026-11-23, partner to Sunday 2026-11-29 and sitter to Saturday 2026-11-28, preserved rates and cleared all offers. The reconfirmation notice was visible. Remove saved week → Load showed no saved plan and preserved current inputs.
