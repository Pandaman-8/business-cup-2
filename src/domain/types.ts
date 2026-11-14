export type TimeRange = { start: string; end: string };
export type ShiftOffer = {
  id: string;
  title: string;
  work: TimeRange;
  hourlyPayCents: number;
  travelCostCents: number;
  commuteBeforeMinutes: number;
  commuteAfterMinutes: number;
};
export type PaidCare = {
  availability: TimeRange[];
  hourlyCostCents: number;
  minBillableMinutesPerVisit: number;
};
export type PlanInput = {
  schemaVersion: 1;
  weekStart: string;
  timeZone: string;
  household: "two-adults" | "single-parent";
  withholdingPercent: number;
  partnerAvailable: TimeRange[];
  existingCareCoverage: TimeRange[];
  unpaidHelperCoverage: TimeRange[];
  paidCare: PaidCare | null;
  offers: ShiftOffer[];
  maxAdditionalShifts: number;
  maxAdditionalWorkMinutes: number | null;
};
export type ReasonCode =
  "SHIFT_LIMIT" | "HOUR_LIMIT" | "OVERLAP" | "MISSING_CARE" | "SITTER_MINIMUM";
export type CoverageAssignment = TimeRange & {
  source: "Partner" | "Arranged care" | "Family / friend" | "Paid sitter";
};
export type PlanResult = {
  selectedShiftIds: string[];
  grossCents: number;
  withholdingCents: number;
  travelCents: number;
  addedCareCents: number;
  netGainCents: number;
  plannedPaidCareVisits: TimeRange[];
  uncoveredCare: TimeRange[];
  coverage: CoverageAssignment[];
  feasible: boolean;
  reasonCodes: ReasonCode[];
};
export type OptimizeResult = {
  best: PlanResult;
  alternatives: PlanResult[];
  rejected: PlanResult[];
  individual: PlanResult[];
  evaluatedCount: number;
  feasibleCount: number;
  hasCoveredWork: boolean;
  assumptions: string[];
};
export type Issue = { path: string; message: string };
