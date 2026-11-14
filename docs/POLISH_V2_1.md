# V2.1 targeted polish

Baseline: `fabf7c4` (production app `cbc63ff`), 14 November 2026. Clean install, typecheck, all 46 tests and production build pass. Preserve domain code, worker, persistence schema and four-step journey.

| Priority | Observed V2 issue | V2.1 expectation |
| --- | --- | --- |
| P0 | One-shift default is behind a disclosure | Visible work-limit question; one/two choices without opening settings; custom limit retained; result shows active limit immediately |
| P0 | Editing work/commute leaves old care hours without a contextual reminder | Name affected shifts, ask for review, preserve literal care hours; acknowledgment never invents coverage |
| P0 | Two individually feasible offers can be rejected together without explanation | Show one relevant rejected combination and its actual solver reasons, separately from feasible ranking |
| P1 | Result uses a tall stack with equal-weight sections | Strong money-first panel beside the reason on desktop; readable sequential layout on mobile |
| P1 | Entry has unused space and a generic presentation | Balanced editorial composition, warmer paper/ink palette, clearer three-step explanation |
| P1 | Costs repeat headings and explanatory text | Compact sections with contextual fields and optional assumptions |
| P1 | Care availability feels like schedule configuration | Short source headings, explicit full-shift checks, advanced ranges stay optional |
| P2 | Minor spacing/financial typography inconsistency | Shared spacing, tabular money, coherent borders, visible focus and 44px controls |

Decisions: implement the above without new dependencies. Defer automatic draft storage: incomplete numeric drafts and saved-plan recovery need a separate storage contract; keep explicit save/load and make reload loss clear. No new modes, backend, external services or engine changes.

Reference review (design cues, not user research): [Wise](https://wise.com/) for prominent financial value; [Stripe Checkout](https://stripe.com/payments/checkout) for focused inputs; [Linear UI refresh](https://linear.app/changelog/2026-03-12-ui-refresh) for consistent controls; [GOV.UK](https://design-system.service.gov.uk/) for labels and recovery; [NN/g progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) and [form cognitive load](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/) for keeping secondary choices out of the primary path; [Baymard](https://baymard.com/research-articles/checkout-flow-average-form-fields) as a reminder to inspect field burden. Checkout findings are not evidence of ShiftMargin conversion gains.

Before: `docs/screenshots/v2-1-before-desktop.jpg` (fresh production capture), `v2-mobile.jpg`, `v2-entry.jpg`. Release evidence will be recorded in `QA_V2_1.md`.
