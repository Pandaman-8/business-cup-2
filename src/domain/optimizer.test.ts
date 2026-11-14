import { describe, expect, it } from 'vitest';
import { demoWeek, blankWeek } from '../data/demoWeek';
import { evaluateSelection, optimize } from './optimizer';
import { minimumCare } from './coverage';
import { parseMoney, payForMinutes, withheld } from './money';
import { atSlot, hasDstTransition, mask, rangesFromMask } from './time';
import { validate } from './validation';
import type { PlanInput, TimeRange } from './types';
const sat = (p: PlanInput) => evaluateSelection(p, ['saturday']);
const range = (a: number, b: number): TimeRange => ({ start: atSlot(a, '2026-11-16'), end: atSlot(b, '2026-11-16') });

describe('required product scenarios', () => {
  it('DEMO_ONE_SHIFT: Sunday $98.40, Saturday $23.20', () => { const p = demoWeek(); expect(optimize(p).best.selectedShiftIds).toEqual(['sunday']); expect(optimize(p).best.netGainCents).toBe(9840); expect(sat(p).netGainCents).toBe(2320); });
  it('DEMO_TWO_SHIFTS: both $121.60', () => { const p = demoWeek(); p.maxAdditionalShifts = 2; expect(optimize(p).best.netGainCents).toBe(12160); expect(optimize(p).best.selectedShiftIds).toEqual(['saturday', 'sunday']); });
  it('PARTNER_UNKNOWN / NO_CARE: exact Sunday gap, choose Saturday', () => { const p = demoWeek(); p.partnerAvailable = []; const r = optimize(p); expect(r.best.selectedShiftIds).toEqual(['saturday']); expect(r.individual.find(x => x.selectedShiftIds[0] === 'sunday')?.uncoveredCare).toEqual([p.offers[1].work]); });
  it('CHANGING_RATE / USER_EDIT: actual solver responds', () => { const p = demoWeek(); p.paidCare!.hourlyCostCents = 2000; expect(sat(p).netGainCents).toBe(720); p.partnerAvailable = []; expect(optimize(p).best.netGainCents).toBe(720); p.paidCare!.hourlyCostCents = 3000; expect(optimize(p).best.netGainCents).toBe(0); });
  it('NEGATIVE_ALL and ZERO: empty wins', () => { const p = demoWeek(); p.offers.forEach(s => s.travelCostCents = 100000); expect(optimize(p).best.selectedShiftIds).toEqual([]); p.offers = [p.offers[1]]; p.offers[0].hourlyPayCents = 0; p.offers[0].travelCostCents = 0; expect(optimize(p).best.selectedShiftIds).toEqual([]); });
  it('OVERLAP: work and commute are hard constraints', () => { const p = demoWeek(); p.maxAdditionalShifts = 2; p.offers[1].work = range(520, 540); expect(evaluateSelection(p, ['saturday', 'sunday']).reasonCodes).toContain('OVERLAP'); p.offers[1].work = { start: '2026-11-21T17:00', end: '2026-11-21T18:00' }; p.offers[1].commuteBeforeMinutes = 15; expect(evaluateSelection(p, ['saturday', 'sunday']).reasonCodes).toContain('OVERLAP'); });
  it('ALREADY_COVERED: overlapping free sources are never double billed', () => { const p = demoWeek(); p.existingCareCoverage = [p.offers[0].work]; p.unpaidHelperCoverage = [p.offers[0].work]; expect(sat(p).addedCareCents).toBe(0); expect(sat(p).coverage).toHaveLength(1); });
  it('TOUCHING_BOUNDARIES / PARTIAL: legal contact and exact subtraction', () => { const p = demoWeek(); p.paidCare = null; p.existingCareCoverage = [{ start: '2026-11-21T09:00', end: '2026-11-21T12:00' }, { start: '2026-11-21T12:00', end: '2026-11-21T16:00' }]; expect(sat(p).uncoveredCare).toEqual([{ start: '2026-11-21T16:00', end: '2026-11-21T17:00' }]); p.existingCareCoverage[1].end = '2026-11-21T17:00'; expect(sat(p).feasible).toBe(true); });
  it('MIN_VISIT: real two-hour booking or reject', () => { const p = demoWeek(); p.offers[0].work.end = '2026-11-21T10:00'; expect(sat(p).addedCareCents).toBe(3600); expect(sat(p).plannedPaidCareVisits).toEqual([{ start: '2026-11-21T09:00', end: '2026-11-21T11:00' }]); p.paidCare!.availability[0].end = '2026-11-21T10:00'; expect(sat(p).reasonCodes).toContain('SITTER_MINIMUM'); expect(sat(p).uncoveredCare).toEqual([p.offers[0].work]); });
  it('MIN_VISIT: extend before need inside actual availability', () => { const p = demoWeek(); p.offers[0].work = { start: '2026-11-21T16:00', end: '2026-11-21T17:00' }; expect(sat(p).plannedPaidCareVisits).toEqual([{ start: '2026-11-21T15:00', end: '2026-11-21T17:00' }]); });
  it('TRAVEL_TIME: care must cover the commute', () => { const p = demoWeek(); p.offers[1].commuteBeforeMinutes = 15; expect(evaluateSelection(p, ['sunday']).uncoveredCare).toEqual([{ start: '2026-11-22T08:45', end: '2026-11-22T09:00' }]); });
  it('CENT_PRECISION: decimal text and round-half-up', () => { expect(parseMoney('12.34')).toBe(1234); expect(parseMoney('0.01')).toBe(1); expect(parseMoney('1.001')).toBeNaN(); expect(parseMoney('1e3')).toBeNaN(); expect(payForMinutes(101, 30)).toBe(51); expect(withheld(101, 50)).toBe(51); expect(withheld(12345, 12.34)).toBe(1523); });
  it('SHIFT_CAP / HOUR_CAP: zero and exact boundary', () => { const p = demoWeek(); p.maxAdditionalShifts = 0; expect(optimize(p).best.netGainCents).toBe(0); p.maxAdditionalShifts = 2; p.maxAdditionalWorkMinutes = 345; expect(optimize(p).best.netGainCents).toBe(0); p.maxAdditionalWorkMinutes = 360; expect(optimize(p).best.netGainCents).toBe(9840); });
  it('SAME_CARE_UNION: touching shifts share a minimum visit', () => { const p = demoWeek(); p.maxAdditionalShifts = 2; p.offers[0].work = range(36, 40); p.offers[1].work = range(40, 44); p.partnerAvailable = []; p.paidCare!.availability = [range(32, 48)]; const r = evaluateSelection(p, ['saturday', 'sunday']); expect(r.feasible).toBe(true); expect(r.addedCareCents).toBe(3600); expect(r.plannedPaidCareVisits).toHaveLength(1); });
  it('BRIDGING: a paid visit across a free gap beats separate minimums', () => { const p = demoWeek(); p.offers[0].work = range(36, 48); p.existingCareCoverage = [range(40, 44)]; p.paidCare!.availability = [range(32, 52)]; expect(sat(p).addedCareCents).toBe(5400); expect(sat(p).plannedPaidCareVisits).toEqual([range(36, 48)]); });
  it('SEPARATE_VISITS: long free gap is not billed when splitting is cheaper', () => { const p = demoWeek(); p.offers[0].work = range(36, 64); p.existingCareCoverage = [range(40, 60)]; p.paidCare!.availability = [range(32, 68)]; expect(sat(p).addedCareCents).toBe(7200); expect(sat(p).plannedPaidCareVisits).toHaveLength(2); });
  it('NO_SITTER / EMPTY: no invented coverage', () => { const p = demoWeek(); p.paidCare = null; expect(sat(p).feasible).toBe(false); expect(optimize(blankWeek()).best.netGainCents).toBe(0); });
  it('DETERMINISTIC_TIES: lexicographic IDs independent of offer order', () => { const p = demoWeek(); p.offers = [{ ...p.offers[1], id: 'z' }, { ...p.offers[1], id: 'a' }]; expect(optimize(p).best.selectedShiftIds).toEqual(['a']); p.offers.reverse(); expect(optimize(p).best.selectedShiftIds).toEqual(['a']); });
});

describe('input contracts', () => {
  it('OUTSIDE_WEEK: invalid dates, 15-minute alignment, commute and week end', () => { const p = demoWeek(); p.offers[0].work.start = '2026-11-15T23:45'; expect(validate(p).length).toBeGreaterThan(0); p.offers[0].work = range(0, 4); p.offers[0].commuteBeforeMinutes = 15; expect(validate(p).length).toBeGreaterThan(0); p.offers[0].commuteBeforeMinutes = 0; p.offers[0].work = range(668, 672); expect(validate(p)).toEqual([]); p.offers[0].work.start = '2026-11-22T23:01'; expect(validate(p).length).toBeGreaterThan(0); p.offers[0].work.start = '2026-02-30T10:00'; expect(validate(p).length).toBeGreaterThan(0); });
  it('DST: spring/fall rejected by explicit zone, Phoenix allowed', () => { expect(hasDstTransition('2026-03-02', 'America/New_York')).toBe(true); expect(hasDstTransition('2026-10-26', 'America/Chicago')).toBe(true); expect(hasDstTransition('2026-03-02', 'America/Phoenix')).toBe(false); const p = blankWeek(); p.weekStart = '2026-03-02'; expect(validate(p).some(i => i.message.includes('daylight'))).toBe(true); });
  it('INVALID: malformed structures never silently enter solver', () => { for (const p of [null, {}, [], { ...demoWeek(), offers: [null] }, { ...demoWeek(), paidCare: {} }, { ...demoWeek(), partnerAvailable: [null] }, { ...demoWeek(), maxAdditionalWorkMinutes: undefined }]) { expect(validate(p).length).toBeGreaterThan(0); expect(() => optimize(p)).toThrow(); } });
  it('INVALID: costs, caps, duplicates, dates and inconsistent household rejected', () => { const p = demoWeek(); p.offers[0].hourlyPayCents = -1; p.offers[1].id = p.offers[0].id; p.withholdingPercent = 20.001; p.household = 'single-parent'; p.maxAdditionalShifts = 11; p.weekStart = '2026-11-17'; expect(validate(p).length).toBeGreaterThanOrEqual(6); });
  it('UNION: interval masks merge overlaps and touching ranges', () => { expect(rangesFromMask(mask([range(1, 3), range(2, 4), range(4, 5)], '2026-11-16'), '2026-11-16')).toEqual([range(1, 5)]); });
});

// Independent oracle: enumerate every subset of possible continuous visits.
// No DP or production money helper is used. Eight slots keep it tractable.
function oracle(required: boolean[], available: boolean[], rate: number, min: number): number {
  const intervals: { start: number; end: number; bits: number; cost: number }[] = [];
  for (let s = 0; s < required.length; s++) for (let e = s + Math.max(1, min); e <= required.length; e++) {
    if (available.slice(s, e).every(Boolean)) intervals.push({ start: s, end: e, bits: ((1 << (e - s)) - 1) << s, cost: Math.floor(rate * (e - s) / 4 + 0.5) });
  }
  const target = required.reduce((m, yes, t) => m | (yes ? 1 << t : 0), 0);
  let best = Infinity;
  function search(index: number, end: number, bits: number, cost: number) {
    if ((bits & target) === target) best = Math.min(best, cost);
    if (cost > best) return;
    for (let i = index; i < intervals.length; i++) { const v = intervals[i]; if (v.start > end) search(i + 1, v.end, bits | v.bits, cost + v.cost); }
  }
  search(0, -1, 0, 0); return best;
}
it('INDEPENDENT_ORACLE: 1,536 exhaustive small care schedules agree', () => {
  for (let bits = 0; bits < 64; bits++) for (const av of [63, 59, 45, 0]) for (const min of [0, 2, 4]) for (const rate of [1, 1801]) {
    const req = Array.from({ length: 6 }, (_, i) => Boolean(bits & (1 << i)));
    const available = Array.from({ length: 6 }, (_, i) => Boolean(av & (1 << i)));
    const actual = minimumCare(req, available, rate, min);
    expect(actual?.cost ?? Infinity, `bits=${bits}, av=${av}, min=${min}, rate=${rate}`).toBe(oracle(req, available, rate, min));
    if (actual) { let end = -1; for (const [s, e] of actual.visits) { expect(s).toBeGreaterThan(end); expect(e - s).toBeGreaterThanOrEqual(Math.max(1, min)); expect(available.slice(s, e).every(Boolean)).toBe(true); end = e; } for (let t = 0; t < req.length; t++) if (req[t]) expect(actual.visits.some(([s, e]) => s <= t && e > t)).toBe(true); }
  }
});
it('INDEPENDENT_SUBSET_ORACLE: joint selection matches separate brute force', () => {
  const p = blankWeek(); p.maxAdditionalShifts = 3; p.withholdingPercent = 0; p.paidCare = { hourlyCostCents: 1801, minBillableMinutesPerVisit: 30, availability: [range(0, 6)] };
  p.offers = [0, 2, 4].map((s, i) => ({ id: String(i), title: 'Offer', work: range(s, s + 1), hourlyPayCents: [1201, 3601, 2401][i], travelCostCents: 0, commuteBeforeMinutes: 0, commuteAfterMinutes: 0 }));
  let best = 0;
  for (let bits = 0; bits < 8; bits++) { const req = Array<boolean>(6).fill(false); let gross = 0; p.offers.forEach((s, i) => { if (bits & (1 << i)) { req[i * 2] = true; gross += Math.floor(s.hourlyPayCents / 4 + 0.5); } }); best = Math.max(best, gross - oracle(req, Array(6).fill(true), 1801, 2)); }
  expect(optimize(p).best.netGainCents).toBe(best);
});
it('PERFORMANCE: ten offers, full-week sitter, all 1,024 subsets', () => { const p = blankWeek(); p.maxAdditionalShifts = 10; p.paidCare = { availability: [range(0, 672)], hourlyCostCents: 1800, minBillableMinutesPerVisit: 120 }; p.offers = Array.from({ length: 10 }, (_, i) => ({ id: String(i), title: 'Shift', work: range(i * 60 + 24, i * 60 + 28), hourlyPayCents: 5000, travelCostCents: 0, commuteBeforeMinutes: 0, commuteAfterMinutes: 0 })); const start = performance.now(); expect(optimize(p).evaluatedCount).toBe(1024); console.log(`10-offer benchmark: ${Math.round(performance.now() - start)} ms`); }, 20000);
