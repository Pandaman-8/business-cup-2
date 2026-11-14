# ShiftMargin — factual pitch handoff

## Deliverables

- Live application: https://pandaman-8.github.io/business-cup-2/
- Public source: https://github.com/Pandaman-8/business-cup-2
- Build/test/deploy history: https://github.com/Pandaman-8/business-cup-2/actions
- Product decisions and limits: PRODUCT_DECISIONS.md
- Actual QA: QA_V2.md (V2); ACCEPTANCE_TESTS.md (V1)
- Screenshots: [desktop](screenshots/v2-desktop.jpg) and [mobile](screenshots/v2-mobile.jpg), captured from the live final application.

The pitch PDF and personal contest submission are the captain's tasks under the supplied execution directive. No submission is claimed. Deadline supplied by captain: 2026-11-15 12:00 Asia/Almaty.

## What the product demonstrably does

An hourly-working parent enters up to ten optional shifts and explicit household care windows. The application jointly searches shift selections and the lowest-cost supported one-sitter visit schedule. It maximizes estimated incremental money kept while enforcing complete care coverage, commute/work conflicts, shift caps and work-hour limits. It includes accepting no extra shift, uses integer cents, and explains the recommendation. It does not book care or estimate exact taxes.

The hypothetical family is illustrative. These are computed scenario results, not customer outcomes:

| Selection |   Gross | Withholding assumption | Added care | Travel |  Money kept |
| --------- | ------: | ---------------------: | ---------: | -----: | ----------: |
| Saturday  | $224.00 |                 $44.80 |    $144.00 | $12.00 |  **$23.20** |
| Sunday    | $138.00 |                 $27.60 |      $0.00 | $12.00 |  **$98.40** |
| Both      | $362.00 |                 $72.40 |    $144.00 | $24.00 | **$121.60** |

Sunday has lower gross pay but leaves $75.20 more in this example. The difference is not a claim of savings for actual users. Removing Sunday's partner care rejects Sunday and chooses Saturday. No alternate coverage is inferred.

## 60–90 second demonstration

1. Open the live link and choose **Try an example**.
2. Explain the one-shift cap: Saturday pays more gross, but Sunday keeps $98.40 versus $23.20.
3. Open **What if my plans change?** and set maximum extra shifts to 2: the computed recommendation becomes both, $121.60.
4. Open **Childcare** and uncheck **My partner**: Sunday is rejected, with the precise uncovered interval shown.
5. Reset the example. Save this week, then Plan next week: rates and care windows carry forward, new offers start empty. Copied availability still needs confirmation.

## Checked competitor positioning (2026-11-14)

| Product                                                                                               | What its official page supports                                                                 | Careful comparison                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Indeed Flex parent Shift Planner](https://indeedflex.com/career-hub/tools/shift-planner/for-parents) | Weekly scheduling, earnings estimates, personal constraints and childcare/transport deductions. | Material overlap exists. Do not claim ShiftMargin invented parent shift planning or income-after-care calculations. The inspected page does not establish whether it solves the exact joint offer-subset / minimum-duration sitter-visit model used here; that comparison remains unverified. |
| [Indeed Flex childcare calculator](https://indeedflex.com/career-hub/tools/childcare-calculator)      | Income-versus-childcare calculator using wages, work hours and household childcare assumptions. | Adjacent direct alternative. ShiftMargin demonstrates explicit time-window feasibility and actual minimum-length visits in its shipped code; no blanket superiority claim.                                                                                                                    |
| [Care.com childcare search](https://www.care.com/child-care)                                          | Helps families find and connect with caregivers.                                                | ShiftMargin has no marketplace, screening or booking. It plans using availability the user already knows.                                                                                                                                                                                     |

This is a narrow official-page comparison, not an exhaustive competitor audit or independently verified assessment of their engines. Their legal/tax statements are not reused as ShiftMargin advice.

## Engineering evidence

Pure TypeScript engine, strict input validation, exhaustive ≤1,024 shift subsets, exact supported-grid care DP, deterministic ties and Web Worker cancellation. Unit tests include a separate exhaustive visit-set oracle, with 1,536 cases, plus independent joint-selection comparison. Public CI installs from the lockfile, tests and builds before deployment.

## Business claims that remain hypotheses

Weekly return and a possible $7.99–9.99 monthly price are unvalidated hypotheses. Customers, revenue, usage, retention, conversion, CAC and LTV are unknown. No paid product, AI feature, real-time care integration or bank connection is implemented. Do not present a market-size or revenue forecast without separate primary-source research and explicit assumptions.
