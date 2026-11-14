# Technical design

React owns input state and presentation. `domain/validation.ts` accepts unknown input and returns field issues; only validated inputs reach the solver. Time is represented as integer quarter-hour slots 0–672 from local Monday. UTC methods are used only as a timezone-neutral calendar coordinate, never to convert entered times. Explicit IANA zone validates DST separately.

`coverage.ts`: Boolean required/free/provider slots perform exact interval union and subtraction. A backward shortest-path DP can skip a slot only when no residual care is required. A visit edge [s,e) requires provider availability at every slot, minimum length, and at least one required slot. Charge round-half-up(rate × minutes / 60). Following a visit, at least one non-required slot separates any next visit; touching segments are one continuous visit. Enumerating all legal edges covers every supported schedule. Optimal substructure gives minimum total rounded cost. Ties prefer fewer visits then deterministic time order. Recover real visit ranges via backpointers. Failure reports required slots outside provider windows capable of meeting the minimum.

`optimizer.ts`: enumerate ≤1024 subsets, enforce count/work-minute caps and non-overlapping work+commute, solve whole-set care, calculate gross/withholding/travel/care/net. Rank deterministically including empty baseline. UI receives best, alternatives, rejected single offers and explored count. Complexity O(2^n × T²), T≤672; benchmark worst-case ten offers and broad provider availability.

All money calculations use bounded integers; decimal currency strings are parsed once with digit arithmetic. Shift/visit rounding uses integer numerator division. Withholding uses integer basis points. No floating-dollar accumulation.

Browser-only deployment, no secrets, no external request needed for calculation, no automatic persistence. Meaningful unit tests include a separate exhaustive visit-set oracle, integration browser smoke tests and production verification. Build artifacts are static; CSP and hosting headers can restrict content and connections.
