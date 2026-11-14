import type { PlanInput } from "../domain/types";

export type PlanSnapshot = { plan: PlanInput; illustrative: boolean };

// Object property order and saved-at metadata are not part of a plan's identity.
// Array order is retained: it is part of the user's entered schedule.
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}

export function samePlan(a: PlanSnapshot, b: PlanSnapshot): boolean {
  return (
    a.illustrative === b.illustrative &&
    JSON.stringify(canonical(a.plan)) === JSON.stringify(canonical(b.plan))
  );
}
