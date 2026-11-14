# ShiftMargin implementation plan v1.1

Earn more. Keep more. A US hourly-working parent enters optional shifts and explicit care availability. The product finds the feasible combination with the highest estimated additional household money against accepting none. No signup, backend, external prices or booking.

## Phase gates
0. React, strict TypeScript, Vite, Tailwind, Vitest; reproducible build.
1. Validated independent engine; exact demo results and independent small-case optimality oracle pass.
2. Editable sample/blank → care → offers → optimizer → explained results, automatic recalculation after edits.
3. Mobile/desktop browser QA, public source and verified public deployment.
4. Only after production P0: opt-in local save and reuse next week, error-safe versioned storage.
5. Final QA and factual pitch evidence. Captain owns pitch PDF and submission unless separately assigned.

## Supported model
- Schema v1 plus required IANA US time zone. Years 2020–2100; one Monday–Sunday week; 15-minute aligned local wall times; week-end endpoint allowed. DST transition weeks rejected.
- Up to 10 optional offers; up to 28 availability ranges per care category. One sitter, one total household rate; no per-child calculations.
- Integer USD cents; round half up per shift and per actual paid visit. Withholding 0–60%, at most two decimals, rounded on aggregate gross.
- Work+commute windows cannot overlap; touching is allowed. Work-minute cap excludes commute.
- Only explicit partner (two adults), arranged care and helper availability cover care at zero incremental cost. Single-parent mode clears partner availability.
- Paid visits must fit continuous sitter availability and last at least the entered minimum. Overlapping/touching availability is merged. Touching paid segments are one visit. Visits may bridge gaps or extend beyond required care within the week/provider availability; actual booked duration is charged.
- Optimize all supported paid visit placements on the 15-minute grid, then every eligible shift subset. Empty choice is feasible at $0. Tie: higher net, fewer shifts, lower care cost, lexicographic IDs. Care tie: lower cost, fewer visits, deterministic time order.
- UI reports gross, withholding estimate, travel, incremental care, money kept, planned care and rejected gaps. Never imply confirmed bookings, precise tax, guaranteed savings or complete family safety.

## Out of scope
Accounts, cloud sync, payments, multiple priced providers, overtime rules, benefits/subsidies, complex taxes, child-specific constraints, baseline work, DST transition weeks and cross-week shifts. Price/retention/market demand are unvalidated hypotheses.

## Acceptance
Demo: Saturday $23.20; Sunday $98.40; cap 1 Sunday; cap 2 both $121.60; removing Sunday partner care rejects Sunday. All relevant edge cases and small independent oracle must pass. See ACCEPTANCE_TESTS.md for actual evidence; a passing local build does not mean production ready.
