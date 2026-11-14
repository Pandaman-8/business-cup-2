# ShiftMargin

**[Open the live app](https://pandaman-8.github.io/business-cup-2/)** · [Public source](https://github.com/Pandaman-8/business-cup-2)

**Earn more. Keep more.** Choose optional shifts that leave your family with the most estimated additional money after childcare, commuting and assumed withholding.

A browser-only React/TypeScript application for hourly-working US parents. No signup, backend, external price feed or booking. Sample data is fictional and runs through the same solver as custom inputs.

## Run locally

Node.js 22.12+ and npm:

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
npm run preview
```

Development: http://localhost:5173. Build output: `dist/`.

## Demo

Choose **Try an example**. With one extra shift allowed, Sunday leaves **$98.40**; Saturday alone leaves **$23.20**. Change maximum shifts to two: both leave **$121.60**. Remove Sunday partner availability: Sunday is rejected and Saturday is selected. These values are calculated, never special-cased.

## Quick Compare and Advanced Planning

Start with your shifts, choose a visible one/two/custom shift limit, confirm specific childcare hours, then enter relevant costs. The result explains the recommended plan and compares it with a feasible alternative. **Advanced Planning** reveals commute buffers, extended availability and work limits on the same focused screens. Switching modes keeps your data.

Changing the week offers an explicit move-or-clear choice, validates the full candidate, and applies it atomically. Care is never inferred from choosing a provider. Editing work or commute times asks you to review existing care; acknowledging the reminder does not extend availability. Results explain one relevant rejected combination separately from the feasible ranking.

## How it works

1. Validate local week, explicit US zone, quarter-hour times, money, limits and care windows.
2. Enumerate all combinations of up to ten shift offers, including accepting none.
3. Reject overlapping work+commute, count/hour-limit violations and uncovered care.
4. For each eligible combination, solve the minimum-cost schedule for one paid sitter using exact dynamic programming over the full 15-minute week. Visits can bridge free periods if cheaper, but must fit actual continuous availability and minimum booking length. Touching paid segments form one visit.
5. Rank by net gain, then fewer shifts, lower paid care cost and lexicographic IDs.

Dollar input is converted once to integer cents. Shift earnings and each full sitter visit round half up; estimated withholding rounds on aggregate gross using basis points. The optimizer runs in a cancellable Web Worker so edits cannot leave stale recommendations or freeze the form.

## Return next week

Choose **Save this week** to store one validated Free plan locally. Replacing it now requires confirmation. **Load a saved week** restores it; **Remove saved week** removes only the Free slot. Nothing is saved automatically; refreshing loses an unsaved plan. There is no cloud sync. **Plan next week** advances care windows seven days, preserves household assumptions, clears shift offers and reminds you to reconfirm availability. A DST transition week is rejected.

## Free and Plus Demo

**Free ($0)** keeps the full optimizer, feasible shift comparison, breakdown, what-if changes, one saved week and next-week reuse. **ShiftMargin Plus ($5.99/month proposed)** adds up to five named plans, a local library with open/rename/delete, and comparison of two snapshots recalculated by the same worker.

Choose **Save another plan**, **Plan library**, or **Free & Plus**, then **Try Plus Demo — No payment required**. This unlocks working features and displays **Plus demo active · No payment processed**. No card, subscription, account or payment is created. Turning Demo off retains the library and relocks its features; clearing the library requires confirmation and preserves the Free slot. Plans stay in this browser. This is a functional monetization prototype; price, willingness to pay and retention are unvalidated hypotheses.

## Boundaries

Single Monday–Sunday week, 15-minute precision, up to ten offers, 28 windows per care source, one sitter charging a household rate. Explicit partner coverage only; no partner inference. Arranged care is zero incremental expense. Supported IANA US zones; DST transition weeks rejected. No baseline work scheduling, overtime/complex taxes, benefit cliffs, subsidies, multi-provider booking or child-specific care requirements. All care is planned, **not confirmed**. No estimates prove real-world savings or market demand.

## Deployment

Static output works on GitHub Pages, Vercel or Netlify. The relative asset base supports repository subpaths. `.github/workflows/deploy.yml` tests/builds and publishes `dist` with GitHub Pages; Pages is enabled for GitHub Actions. Only pushes to main deploy, matching the existing main-only environment policy. The CI workflow separately checks tests and build. No API keys required.

## Documentation

- [Final jury handoff, release audit and evidence](docs/FINAL_JURY_HANDOFF.md)
- [V2.2 audit](docs/V2_2_AUDIT.md)
- [Free/Plus model and monetization limits](docs/MONETIZATION_V2_2.md)
- [V2.2 release QA](docs/QA_V2_2.md)
- [V2.2 factual pitch handoff and demo script](docs/PITCH_EVIDENCE_V2_2.md)
- [V2.1 polish decisions](docs/POLISH_V2_1.md)
- [V2.1 release QA](docs/QA_V2_1.md)
- [V2 UX architecture](docs/UX_REDESIGN_V2.md)
- [V2 release QA](docs/QA_V2.md)
- [Master plan](docs/MASTER_PLAN.md)
- [Audit and product decisions](docs/PRODUCT_DECISIONS.md)
- [Technical design and exactness model](docs/TECHNICAL_DESIGN.md)
- [Acceptance tests and actual QA](docs/ACCEPTANCE_TESTS.md)
- [Factual pitch handoff and competitor sources](docs/PITCH_EVIDENCE.md)

Implementation follows the official [Vite guide](https://vite.dev/guide/) and [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite).
