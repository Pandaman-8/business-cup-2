import type {
  PlanInput,
  ShiftOffer,
  TimeRange,
  OptimizeResult,
} from "../domain/types";
import { localMillis, shiftDate } from "../domain/time";
import { validate } from "../domain/validation";
export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(new Date(date + "T12:00:00Z"));
}
export function careForShift(s: ShiftOffer): TimeRange {
  const stamp = (value: string, minutes: number) =>
    new Date(localMillis(value) + minutes * 60000).toISOString().slice(0, 16);
  return {
    start: stamp(s.work.start, -s.commuteBeforeMinutes),
    end: stamp(s.work.end, s.commuteAfterMinutes),
  };
}
export function moveWeek(
  input: PlanInput,
  week: string,
  action: "move" | "clear",
): PlanInput {
  // Validate the target date before performing calendar arithmetic. Never partly apply a move.
  const targetIssues = validate({ ...input, weekStart: week }).filter(
    (i) => i.path === "weekStart" || i.path === "timeZone",
  );
  if (targetIssues.length) throw new Error(targetIssues[0].message);
  const delta =
    (localMillis(week + "T00:00") - localMillis(input.weekStart + "T00:00")) /
    86400000;
  const move = (r: TimeRange): TimeRange => ({
    start: shiftDate(r.start, delta) + r.start.slice(10),
    end: shiftDate(r.end, delta) + r.end.slice(10),
  });
  const list = (ranges: TimeRange[]) =>
    action === "move" ? ranges.map(move) : [];
  const next: PlanInput = {
    ...input,
    weekStart: week,
    offers:
      action === "move"
        ? input.offers.map((s) => ({ ...s, work: move(s.work) }))
        : [],
    partnerAvailable: list(input.partnerAvailable),
    existingCareCoverage: list(input.existingCareCoverage),
    unpaidHelperCoverage: list(input.unpaidHelperCoverage),
    paidCare: input.paidCare
      ? { ...input.paidCare, availability: list(input.paidCare.availability) }
      : null,
  };
  const nextIssues = validate(next);
  if (nextIssues.length)
    throw new Error("Before changing weeks: " + nextIssues[0].message);
  return next;
}
export function comparison(result: OptimizeResult) {
  const alternative =
    result.alternatives.find((a) => a.selectedShiftIds.length > 0) ??
    result.alternatives[0];
  return alternative
    ? {
        alternative,
        difference: result.best.netGainCents - alternative.netGainCents,
      }
    : null;
}
