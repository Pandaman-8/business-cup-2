import { payForMinutes } from "./money";
import { atSlot, mask, rangesFromMask, SLOTS } from "./time";
import type { CoverageAssignment, PlanInput, TimeRange } from "./types";
export type CareSolution = { cost: number; visits: [number, number][] };
// Exact shortest path over all supported visits. A full free slot must
// separate visits: touching paid segments form one continuous visit.
export function minimumCare(
  required: boolean[],
  available: boolean[],
  rate: number,
  minimumSlots: number,
): CareSolution | null {
  const n = required.length;
  const dp = new Float64Array(n + 2).fill(Infinity);
  const count = new Float64Array(n + 2).fill(Infinity);
  const choice = new Int32Array(n).fill(-1);
  const runEnd = new Int32Array(n + 1);
  const prefix = new Int32Array(n + 1);
  const nextRequired = new Int32Array(n + 1).fill(n);
  for (let t = 0; t < n; t++) prefix[t + 1] = prefix[t] + Number(required[t]);
  for (let t = n - 1; t >= 0; t--)
    runEnd[t] = available[t] ? (available[t + 1] ? runEnd[t + 1] : t + 1) : t;
  for (let t = n - 1; t >= 0; t--)
    nextRequired[t] = required[t] ? t : nextRequired[t + 1];
  const costs = Array.from({ length: n + 1 }, (_, len) =>
    payForMinutes(rate, len * 15),
  );
  dp[n] = dp[n + 1] = 0;
  count[n] = count[n + 1] = 0;
  for (let t = n - 1; t >= 0; t--) {
    if (!required[t]) {
      dp[t] = dp[t + 1];
      count[t] = count[t + 1];
    }
    if (nextRequired[t] === n) continue;
    // If trimming one leading free slot still meets the minimum, a later
    // start covers exactly the same needs at no greater cost. The skip edge
    // already represents that schedule, so this start is dominated.
    if (nextRequired[t] - t >= Math.max(1, minimumSlots)) continue;
    for (
      let e = Math.max(t + Math.max(1, minimumSlots), nextRequired[t] + 1);
      e <= runEnd[t];
      e++
    ) {
      // All remaining costs are nonnegative and visit cost is monotone.
      // Longer visits cannot improve an already cheaper complete solution.
      if (costs[e - t] > dp[t]) break;
      if (prefix[e] === prefix[t] || (e < n && required[e])) continue;
      const next = e < n ? e + 1 : n;
      const candidate = costs[e - t] + dp[next];
      const visits = 1 + count[next];
      if (candidate < dp[t] || (candidate === dp[t] && visits < count[t])) {
        dp[t] = candidate;
        count[t] = visits;
        choice[t] = e;
      }
    }
  }
  if (!Number.isFinite(dp[0])) return null;
  const visits: [number, number][] = [];
  for (let t = 0; t < n;) {
    const e = choice[t];
    if (e < 0) t++;
    else {
      visits.push([t, e]);
      t = e + 1;
    }
  }
  return { cost: dp[0], visits };
}
export function planCare(required: boolean[], input: PlanInput) {
  const sources = [
    {
      source: "Partner" as const,
      ranges: input.household === "two-adults" ? input.partnerAvailable : [],
    },
    { source: "Arranged care" as const, ranges: input.existingCareCoverage },
    { source: "Family / friend" as const, ranges: input.unpaidHelperCoverage },
  ];
  const residual = [...required];
  const coverage: CoverageAssignment[] = [];
  for (const { source, ranges } of sources) {
    const free = mask(ranges, input.weekStart);
    const used = free.map((v, i) => v && residual[i]);
    coverage.push(
      ...rangesFromMask(used, input.weekStart).map((r) => ({ ...r, source })),
    );
    used.forEach((v, i) => {
      if (v) residual[i] = false;
    });
  }
  if (!residual.some(Boolean))
    return {
      cost: 0,
      visits: [] as TimeRange[],
      uncovered: [] as TimeRange[],
      coverage,
      minimumFailure: false,
    };
  const available = mask(input.paidCare?.availability ?? [], input.weekStart);
  const minimum = (input.paidCare?.minBillableMinutesPerVisit ?? 0) / 15;
  const solution = input.paidCare
    ? minimumCare(residual, available, input.paidCare.hourlyCostCents, minimum)
    : null;
  if (!solution) {
    // A continuous availability component at least minimum long can cover any
    // required slot inside it. Shorter components cannot host a legal visit.
    const usable = [...available];
    for (let t = 0; t < SLOTS;) {
      if (!available[t]) {
        t++;
        continue;
      }
      const start = t;
      while (available[t] && t < SLOTS) t++;
      if (t - start < minimum)
        for (let j = start; j < t; j++) usable[j] = false;
    }
    return {
      cost: 0,
      visits: [] as TimeRange[],
      uncovered: rangesFromMask(
        residual.map((v, i) => v && !usable[i]),
        input.weekStart,
      ),
      coverage,
      minimumFailure: residual.some((v, i) => v && available[i] && !usable[i]),
    };
  }
  const visits = solution.visits.map(([start, end]) => ({
    start: atSlot(start, input.weekStart),
    end: atSlot(end, input.weekStart),
  }));
  coverage.push(
    ...rangesFromMask(residual, input.weekStart).map((r) => ({
      ...r,
      source: "Paid sitter" as const,
    })),
  );
  return {
    cost: solution.cost,
    visits,
    uncovered: [] as TimeRange[],
    coverage,
    minimumFailure: false,
  };
}
