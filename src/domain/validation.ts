import type { Issue, PlanInput } from "./types";
import { hasDstTransition, localMillis, slot, SLOTS, ZONES } from "./time";
import { MAX_CENTS } from "./money";
export function validate(input: unknown): Issue[] {
  const issues: Issue[] = [];
  const add = (path: string, message: string) => issues.push({ path, message });
  if (!input || typeof input !== "object" || Array.isArray(input))
    return [{ path: "plan", message: "Enter a valid weekly plan." }];
  const x = input as Record<string, unknown>;
  const integer = (n: unknown, min: number, max: number) =>
    typeof n === "number" && Number.isSafeInteger(n) && n >= min && n <= max;
  if (x.schemaVersion !== 1) add("schemaVersion", "Unsupported plan version.");
  const week = typeof x.weekStart === "string" ? x.weekStart : "";
  const epoch = localMillis(week + "T00:00");
  const validWeek =
    /^20\d{2}-\d{2}-\d{2}$|^2100-\d{2}-\d{2}$/.test(week) &&
    Number.isFinite(epoch) &&
    Number(week.slice(0, 4)) >= 2020 &&
    new Date(epoch).getUTCDay() === 1;
  if (!validWeek) add("weekStart", "Choose a Monday between 2020 and 2100.");
  if (!ZONES.includes(x.timeZone as (typeof ZONES)[number]))
    add("timeZone", "Choose a supported US time zone.");
  else if (validWeek && hasDstTransition(week, x.timeZone as string))
    add(
      "weekStart",
      "This week changes daylight saving time. Choose a week without a clock change.",
    );
  if (!["two-adults", "single-parent"].includes(x.household as string))
    add("household", "Choose your household type.");
  if (
    typeof x.withholdingPercent !== "number" ||
    !Number.isFinite(x.withholdingPercent) ||
    x.withholdingPercent < 0 ||
    x.withholdingPercent > 60 ||
    Math.abs(
      x.withholdingPercent * 100 - Math.round(x.withholdingPercent * 100),
    ) > 1e-8
  )
    add(
      "withholdingPercent",
      "Enter a withholding estimate from 0 to 60%, with up to two decimals.",
    );
  if (!integer(x.maxAdditionalShifts, 0, 10))
    add("maxAdditionalShifts", "Choose 0–10 extra shifts.");
  if (
    x.maxAdditionalWorkMinutes !== null &&
    (!integer(x.maxAdditionalWorkMinutes, 0, 10080) ||
      (x.maxAdditionalWorkMinutes as number) % 15 !== 0)
  )
    add(
      "maxAdditionalWorkMinutes",
      "Use a work cap from 0 to 168 hours in 15-minute increments, or leave it blank.",
    );
  const range = (value: unknown, path: string) => {
    if (!value || typeof value !== "object") {
      add(path, "Enter a start and end time.");
      return;
    }
    const r = value as Record<string, unknown>;
    const a = typeof r.start === "string" ? localMillis(r.start) : NaN;
    const b = typeof r.end === "string" ? localMillis(r.end) : NaN;
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a)
      add(path, "Enter real dates with the end after the start.");
    else if (a % 900000 || b % 900000)
      add(path, "Use 15-minute increments (:00, :15, :30, :45).");
    else if (validWeek && (a < epoch || b > epoch + 7 * 86400000))
      add(path, "Keep this interval inside the selected Monday–Sunday week.");
  };
  const list = (value: unknown, path: string) => {
    if (!Array.isArray(value) || value.length > 28) {
      add(path, "Use at most 28 availability windows.");
      return;
    }
    value.forEach((r, i) => range(r, `${path}.${i}`));
  };
  for (const key of [
    "partnerAvailable",
    "existingCareCoverage",
    "unpaidHelperCoverage",
  ])
    list(x[key], key);
  if (
    x.household === "single-parent" &&
    Array.isArray(x.partnerAvailable) &&
    x.partnerAvailable.length
  )
    add(
      "partnerAvailable",
      "Single-parent plans cannot include partner availability.",
    );
  const cost = (value: unknown, path: string) => {
    if (!integer(value, 0, MAX_CENTS))
      add(path, "Enter $0–$10,000 in whole cents.");
  };
  if (x.paidCare !== null) {
    if (!x.paidCare || typeof x.paidCare !== "object")
      add("paidCare", "Enter sitter settings or turn paid care off.");
    else {
      const p = x.paidCare as Record<string, unknown>;
      list(p.availability, "paidCare.availability");
      cost(p.hourlyCostCents, "paidCare.hourlyCostCents");
      if (
        !integer(p.minBillableMinutesPerVisit, 0, 10080) ||
        (p.minBillableMinutesPerVisit as number) % 15 !== 0
      )
        add(
          "paidCare.minBillableMinutesPerVisit",
          "Use a minimum of 0–168 hours, in 15-minute increments.",
        );
    }
  }
  if (!Array.isArray(x.offers) || x.offers.length > 10)
    add("offers", "Use at most 10 optional shifts.");
  else {
    const ids = new Set<string>();
    x.offers.forEach((value: unknown, i: number) => {
      const path = `offers.${i}`;
      if (!value || typeof value !== "object") {
        add(path, "Enter a valid shift.");
        return;
      }
      const s = value as Record<string, unknown>;
      if (
        typeof s.id !== "string" ||
        !s.id ||
        s.id.length > 100 ||
        ids.has(s.id)
      )
        add(path + ".id", "Shift IDs must be unique and nonempty.");
      else ids.add(s.id);
      if (typeof s.title !== "string" || !s.title.trim() || s.title.length > 80)
        add(path + ".title", "Name this shift (1–80 characters).");
      range(s.work, path + ".work");
      cost(s.hourlyPayCents, path + ".hourlyPayCents");
      cost(s.travelCostCents, path + ".travelCostCents");
      for (const key of ["commuteBeforeMinutes", "commuteAfterMinutes"])
        if (!integer(s[key], 0, 1440) || (s[key] as number) % 15 !== 0)
          add(
            `${path}.${key}`,
            "Use 0–1,440 commute minutes in 15-minute increments.",
          );
      if (validWeek && s.work && typeof s.work === "object") {
        const w = s.work as Record<string, unknown>;
        if (
          typeof w.start === "string" &&
          typeof w.end === "string" &&
          (slot(w.start, week) - Number(s.commuteBeforeMinutes) / 15 < 0 ||
            slot(w.end, week) + Number(s.commuteAfterMinutes) / 15 > SLOTS)
        )
          add(
            path + ".work",
            "The shift including commute must fit inside this week.",
          );
      }
    });
  }
  return issues;
}
export class ValidationError extends Error {
  constructor(public issues: Issue[]) {
    super(issues.map((i) => `${i.path}: ${i.message}`).join("\n"));
    this.name = "ValidationError";
  }
}
export function assertPlan(input: unknown): asserts input is PlanInput {
  const issues = validate(input);
  if (issues.length) throw new ValidationError(issues);
}
