import type {
  OptimizeResult,
  PlanInput,
  PlanResult,
  ShiftOffer,
} from "./types";
import { assertPlan } from "./validation";
import { payForMinutes, withheld } from "./money";
import { slot, SLOTS } from "./time";
import { planCare } from "./coverage";
function evaluate(input: PlanInput, shifts: ShiftOffer[]): PlanResult {
  const p: PlanResult = {
    selectedShiftIds: shifts.map((s) => s.id).sort(),
    grossCents: 0,
    withholdingCents: 0,
    travelCents: 0,
    addedCareCents: 0,
    netGainCents: 0,
    plannedPaidCareVisits: [],
    uncoveredCare: [],
    coverage: [],
    feasible: true,
    reasonCodes: [],
  };
  if (shifts.length > input.maxAdditionalShifts)
    p.reasonCodes.push("SHIFT_LIMIT");
  const required = Array<boolean>(SLOTS).fill(false);
  let totalMinutes = 0;
  for (const s of shifts) {
    const a = slot(s.work.start, input.weekStart),
      b = slot(s.work.end, input.weekStart);
    totalMinutes += (b - a) * 15;
    p.grossCents += payForMinutes(s.hourlyPayCents, (b - a) * 15);
    p.travelCents += s.travelCostCents;
    for (
      let t = a - s.commuteBeforeMinutes / 15;
      t < b + s.commuteAfterMinutes / 15;
      t++
    ) {
      if (required[t] && !p.reasonCodes.includes("OVERLAP"))
        p.reasonCodes.push("OVERLAP");
      required[t] = true;
    }
  }
  if (
    input.maxAdditionalWorkMinutes !== null &&
    totalMinutes > input.maxAdditionalWorkMinutes
  )
    p.reasonCodes.push("HOUR_LIMIT");
  p.withholdingCents = withheld(p.grossCents, input.withholdingPercent);
  if (!p.reasonCodes.length) {
    const care = planCare(required, input);
    p.addedCareCents = care.cost;
    p.plannedPaidCareVisits = care.visits;
    p.uncoveredCare = care.uncovered;
    p.coverage = care.coverage;
    if (care.uncovered.length)
      p.reasonCodes.push(
        care.minimumFailure ? "SITTER_MINIMUM" : "MISSING_CARE",
      );
  }
  p.feasible = !p.reasonCodes.length;
  p.netGainCents =
    p.grossCents - p.withholdingCents - p.travelCents - p.addedCareCents;
  return p;
}
export function evaluateSelection(input: unknown, ids: string[]): PlanResult {
  assertPlan(input);
  if (
    new Set(ids).size !== ids.length ||
    ids.some((id) => !input.offers.some((s) => s.id === id))
  )
    throw new Error("Unknown or duplicate selected shift.");
  return evaluate(
    input,
    input.offers.filter((s) => ids.includes(s.id)),
  );
}
const lexical = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
export function comparePlans(a: PlanResult, b: PlanResult): number {
  return (
    b.netGainCents - a.netGainCents ||
    a.selectedShiftIds.length - b.selectedShiftIds.length ||
    a.addedCareCents - b.addedCareCents ||
    lexical(
      JSON.stringify(a.selectedShiftIds),
      JSON.stringify(b.selectedShiftIds),
    )
  );
}
export function optimize(input: unknown): OptimizeResult {
  assertPlan(input);
  const feasible: PlanResult[] = [],
    rejected: PlanResult[] = [],
    individual: PlanResult[] = [];
  const evaluatedCount = 2 ** input.offers.length;
  for (let bits = 0; bits < evaluatedCount; bits++) {
    const p = evaluate(
      input,
      input.offers.filter((_, i) => bits & (1 << i)),
    );
    (p.feasible ? feasible : rejected).push(p);
    if (p.selectedShiftIds.length === 1) individual.push(p);
  }
  feasible.sort(comparePlans);
  return {
    best: feasible[0],
    alternatives: feasible.slice(1, 5),
    rejected,
    individual,
    evaluatedCount,
    feasibleCount: feasible.length,
    hasCoveredWork: feasible.some((p) => p.selectedShiftIds.length > 0),
    assumptions: [
      "Compared with accepting no extra shifts.",
      "Withholding is an estimate, not a tax calculation.",
      "Planned care — confirm directly. Availability is user-entered.",
      "Overtime, benefit changes, subsidies and baseline family expenses are not included.",
    ],
  };
}
