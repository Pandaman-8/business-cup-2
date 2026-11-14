import type { PlanInput } from "../domain/types";
export function demoWeek(): PlanInput {
  return {
    schemaVersion: 1,
    weekStart: "2026-11-16",
    timeZone: "America/Chicago",
    household: "two-adults",
    withholdingPercent: 20,
    partnerAvailable: [{ start: "2026-11-22T09:00", end: "2026-11-22T15:00" }],
    existingCareCoverage: [],
    unpaidHelperCoverage: [],
    paidCare: {
      availability: [{ start: "2026-11-21T09:00", end: "2026-11-21T17:00" }],
      hourlyCostCents: 1800,
      minBillableMinutesPerVisit: 120,
    },
    offers: [
      {
        id: "saturday",
        title: "Saturday shift",
        work: { start: "2026-11-21T09:00", end: "2026-11-21T17:00" },
        hourlyPayCents: 2800,
        travelCostCents: 1200,
        commuteBeforeMinutes: 0,
        commuteAfterMinutes: 0,
      },
      {
        id: "sunday",
        title: "Sunday shift",
        work: { start: "2026-11-22T09:00", end: "2026-11-22T15:00" },
        hourlyPayCents: 2300,
        travelCostCents: 1200,
        commuteBeforeMinutes: 0,
        commuteAfterMinutes: 0,
      },
    ],
    maxAdditionalShifts: 1,
    maxAdditionalWorkMinutes: null,
  };
}
export function blankWeek(): PlanInput {
  return {
    ...demoWeek(),
    partnerAvailable: [],
    paidCare: null,
    offers: [],
    maxAdditionalShifts: 3,
  };
}
