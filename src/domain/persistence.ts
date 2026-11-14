import type { PlanInput, TimeRange } from "./types";
import { assertPlan } from "./validation";
import { shiftDate } from "./time";
export const STORAGE_KEY = "shiftmargin.saved-week.v1";
export type SavedWeek = {
  storageVersion: 1;
  plan: PlanInput;
  illustrative: boolean;
  savedAt: string;
};
export function serializeWeek(plan: unknown, illustrative: boolean): string {
  assertPlan(plan);
  return JSON.stringify({
    storageVersion: 1,
    plan,
    illustrative,
    savedAt: new Date().toISOString(),
  } satisfies SavedWeek);
}
export function deserializeWeek(text: string): SavedWeek {
  if (text.length > 100000) throw new Error("This saved week is too large.");
  const saved: unknown = JSON.parse(text);
  if (!saved || typeof saved !== "object")
    throw new Error("Saved week is not valid.");
  const record = saved as Record<string, unknown>;
  if (
    record.storageVersion !== 1 ||
    typeof record.illustrative !== "boolean" ||
    typeof record.savedAt !== "string" ||
    !Number.isFinite(Date.parse(record.savedAt))
  )
    throw new Error("This saved week uses an unsupported format.");
  assertPlan(record.plan);
  return record as SavedWeek;
}
export function nextWeekSettings(input: unknown): PlanInput {
  assertPlan(input);
  const move = (r: TimeRange): TimeRange => ({
    start: shiftDate(r.start, 7) + r.start.slice(10),
    end: shiftDate(r.end, 7) + r.end.slice(10),
  });
  const plan: PlanInput = {
    ...input,
    weekStart: shiftDate(input.weekStart, 7),
    partnerAvailable: input.partnerAvailable.map(move),
    existingCareCoverage: input.existingCareCoverage.map(move),
    unpaidHelperCoverage: input.unpaidHelperCoverage.map(move),
    paidCare: input.paidCare
      ? {
          ...input.paidCare,
          availability: input.paidCare.availability.map(move),
        }
      : null,
    offers: [],
  };
  assertPlan(plan);
  return plan;
}
