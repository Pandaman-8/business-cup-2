# ShiftMargin

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

Load **Try a sample family**. With one extra shift allowed, Sunday leaves **$98.40**; Saturday alone leaves **$23.20**. Change maximum shifts to two: both leave **$121.60**. Remove Sunday partner availability: Sunday is rejected and Saturday is selected. These values are calculated, never special-cased.

## How it works

1. Validate local week, explicit US zone, quarter-hour times, money, limits and care windows.
2. Enumerate all combinations of up to ten shift offers, including accepting none.
3. Reject overlapping work+commute, count/hour-limit violations and uncovered care.
4. For each eligible combination, solve the minimum-cost schedule for one paid sitter using exact dynamic programming over the full 15-minute week. Visits can bridge free periods if cheaper, but must fit actual continuous availability and minimum booking length. Touching paid segments form one visit.
5. Rank by net gain, then fewer shifts, lower paid care cost and lexicographic IDs.

Dollar input is converted once to integer cents. Shift earnings and each full sitter visit round half up; estimated withholding rounds on aggregate gross using basis points. The optimizer runs in a cancellable Web Worker so edits cannot leave stale recommendations or freeze the form.

## Boundaries

Single Monday–Sunday week, 15-minute precision, up to ten offers, 28 windows per care source, one sitter charging a household rate. Explicit partner coverage only; no partner inference. Arranged care is zero incremental expense. Supported IANA US zones; DST transition weeks rejected. No baseline work scheduling, overtime/complex taxes, benefit cliffs, subsidies, multi-provider booking or child-specific care requirements. All care is planned, **not confirmed**. No estimates prove real-world savings or market demand.

## Deployment

Static output works on GitHub Pages, Vercel or Netlify. The relative asset base supports repository subpaths. `.github/workflows/deploy.yml` tests/builds and publishes `dist` with GitHub Pages; Pages must be enabled for GitHub Actions. The CI workflow separately checks tests and build. No API keys required.

## Documentation

- [Master plan](docs/MASTER_PLAN.md)
- [Audit and product decisions](docs/PRODUCT_DECISIONS.md)
- [Technical design and exactness model](docs/TECHNICAL_DESIGN.md)
- [Acceptance tests and actual QA](docs/ACCEPTANCE_TESTS.md)

Implementation follows the official [Vite guide](https://vite.dev/guide/) and [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite).
