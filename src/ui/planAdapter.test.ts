import { describe, it, expect } from "vitest";
import { demoWeek } from "../data/demoWeek";
import { optimize } from "../domain/optimizer";
import { validate } from "../domain/validation";
import { careForShift, comparison, moveWeek } from "./planAdapter";
describe("V2 UI adapters preserve the engine contract", () => {
  it("moves every schedule source atomically, without mutating the original", () => {
    const p = demoWeek();
    p.existingCareCoverage = [p.offers[0].work];
    p.unpaidHelperCoverage = [p.offers[1].work];
    const before = JSON.stringify(p);
    const next = moveWeek(p, "2026-11-30", "move");
    expect(validate(next)).toEqual([]);
    expect(next.offers[0].work.start).toBe("2026-12-05T09:00");
    expect(next.partnerAvailable[0].start).toBe("2026-12-06T09:00");
    expect(next.existingCareCoverage[0].start).toBe("2026-12-05T09:00");
    expect(next.unpaidHelperCoverage[0].start).toBe("2026-12-06T09:00");
    expect(next.paidCare!.availability[0].start).toBe("2026-12-05T09:00");
    expect(optimize(next).best.netGainCents).toBe(
      optimize(p).best.netGainCents,
    );
    expect(JSON.stringify(p)).toBe(before);
  });
  it("clears all schedule windows only with the explicit clear action", () => {
    const p = moveWeek(demoWeek(), "2026-11-23", "clear");
    expect(p.offers).toEqual([]);
    expect(p.partnerAvailable).toEqual([]);
    expect(p.paidCare!.availability).toEqual([]);
    expect(p.paidCare!.hourlyCostCents).toBe(1800);
  });
  it("rejects invalid and DST target weeks without changing input", () => {
    const p = demoWeek();
    const before = JSON.stringify(p);
    for (const date of ["", "2026-11-24", "2026-03-02", "2019-12-30"])
      expect(() => moveWeek(p, date, "move")).toThrow();
    expect(JSON.stringify(p)).toBe(before);
  });
  it("explicit care presets include both commute buffers", () => {
    const s = demoWeek().offers[0];
    expect(
      careForShift({ ...s, commuteBeforeMinutes: 30, commuteAfterMinutes: 15 }),
    ).toEqual({ start: "2026-11-21T08:30", end: "2026-11-21T17:15" });
  });
  it("comparisons follow current caps, not fixture-specific copy", () => {
    const p = demoWeek();
    let c = comparison(optimize(p))!;
    expect(c.difference).toBe(7520);
    expect(c.alternative.selectedShiftIds).toEqual(["saturday"]);
    p.maxAdditionalShifts = 2;
    c = comparison(optimize(p))!;
    expect(c.difference).toBe(2320);
    expect(c.alternative.selectedShiftIds).toEqual(["sunday"]);
    p.partnerAvailable = [];
    expect(comparison(optimize(p))!.alternative.selectedShiftIds).toEqual([]);
  });
  it("supports zero-work recommendations without claiming an unavailable alternative", () => {
    const p = demoWeek();
    p.partnerAvailable = [];
    p.paidCare = null;
    expect(comparison(optimize(p))).toBeNull();
  });
});
