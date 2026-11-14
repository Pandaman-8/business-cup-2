import { describe, expect, it } from "vitest";
import { samePlan } from "./planIdentity";
import { demoWeek } from "../data/demoWeek";
import { deserializeWeek, serializeWeek } from "../domain/persistence";
import {
  LIBRARY_KEY,
  DEMO_KEY,
  MAX_LIBRARY_CHARS,
  makeSavedPlan,
  parseLibrary,
  serializeLibrary,
  writeLibrary,
  clearLibrary,
  demoIsActive,
  setDemo,
  planName,
} from "./planLibrary";
import type { StorageAccess } from "./planLibrary";
function memory(): StorageAccess {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, v);
    },
    removeItem: (k) => {
      data.delete(k);
    },
  };
}
const item = () => makeSavedPlan(demoWeek(), true, "Original week");
describe("bounded, isolated Plus storage", () => {
  it("round-trips five distinct input snapshots without storing results", () => {
    const p = demoWeek();
    const plans = Array.from({ length: 5 }, (_, i) =>
      makeSavedPlan(p, true, `Plan ${i + 1}`),
    );
    p.offers[0].hourlyPayCents = 1;
    expect(plans[0].plan.offers[0].hourlyPayCents).toBe(2800);
    expect(parseLibrary(serializeLibrary(plans))).toEqual(plans);
    expect(Object.keys(plans[0]).sort()).toEqual([
      "id",
      "illustrative",
      "name",
      "plan",
      "savedAt",
    ]);
  });
  it("rejects a thirteenth plan, duplicate IDs and invalid inputs", () => {
    const p = item();
    expect(() => serializeLibrary(Array.from({ length: 13 }, item))).toThrow();
    expect(() => serializeLibrary([p, p])).toThrow(/unique/);
    p.plan.withholdingPercent = -1;
    expect(() => serializeLibrary([p])).toThrow();
  });
  it("handles empty storage but rejects damaged JSON, old versions and malformed records", () => {
    expect(parseLibrary(null)).toEqual([]);
    for (const text of [
      "",
      "{",
      "null",
      "[]",
      "{}",
      '{"libraryVersion":0,"plans":[]}',
      '{"libraryVersion":2,"plans":[]}',
      '{"libraryVersion":1,"plans":[null]}',
      JSON.stringify({
        libraryVersion: 1,
        plans: [{ ...item(), savedAt: "yesterday" }],
      }),
    ])
      expect(() => parseLibrary(text)).toThrow();
  });
  it("bounds both the library and individual stored records", () => {
    expect(() => parseLibrary(" ".repeat(MAX_LIBRARY_CHARS + 1))).toThrow(
      /large/,
    );
    const p = item();
    (p.plan as unknown as Record<string, unknown>).unexpected = "x".repeat(
      100_000,
    );
    expect(() => serializeLibrary([p])).toThrow(/large/);
  });
  it("validates names while preserving text safely for React rendering", () => {
    expect(planName("  Weekend  ")).toBe("Weekend");
    expect(planName('<img src=x onerror="alert(1)">')).toContain("<img");
    for (const name of ["", " ", "x".repeat(61), "a\nb"])
      expect(() => planName(name)).toThrow();
  });
  it("detects another tab's changes before writes or deletion", () => {
    const storage = memory();
    const first = writeLibrary(storage, [item()], null);
    const other = serializeLibrary([item(), item()]);
    storage.setItem(LIBRARY_KEY, other);
    expect(() => writeLibrary(storage, [], first)).toThrow(/another tab/);
    expect(() => clearLibrary(storage, first)).toThrow(/another tab/);
    expect(storage.getItem(LIBRARY_KEY)).toBe(other);
  });
  it("does not destroy data on quota errors or unavailable storage", () => {
    const storage = memory();
    const previous = writeLibrary(storage, [item()], null);
    storage.setItem = () => {
      throw new DOMException("Quota", "QuotaExceededError");
    };
    expect(() => writeLibrary(storage, [item()], previous)).toThrow();
    expect(storage.getItem(LIBRARY_KEY)).toBe(previous);
    storage.getItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
    expect(() => writeLibrary(storage, [], previous)).toThrow();
    expect(() => demoIsActive(storage)).toThrow();
  });
  it("removes only the requested library key and leaves Free and unrelated data alone", () => {
    const storage = memory();
    storage.setItem("unrelated", "keep");
    storage.setItem(
      "shiftmargin.saved-week.v1",
      serializeWeek(demoWeek(), true),
    );
    const text = writeLibrary(storage, [item()], null);
    clearLibrary(storage, text);
    expect(storage.getItem(LIBRARY_KEY)).toBeNull();
    expect(storage.getItem("unrelated")).toBe("keep");
    expect(
      deserializeWeek(storage.getItem("shiftmargin.saved-week.v1")!).plan,
    ).toEqual(demoWeek());
  });
  it("persists demo access, ignores unsupported flags, and keeps plans when disabled", () => {
    const storage = memory();
    expect(demoIsActive(storage)).toBe(false);
    for (const text of [
      "{",
      "true",
      '{"demoVersion":2,"active":true}',
      "x".repeat(101),
    ]) {
      storage.setItem(DEMO_KEY, text);
      expect(demoIsActive(storage)).toBe(false);
    }
    const text = writeLibrary(storage, [item()], null);
    setDemo(storage, true);
    expect(demoIsActive(storage)).toBe(true);
    setDemo(storage, false);
    expect(demoIsActive(storage)).toBe(false);
    expect(storage.getItem(LIBRARY_KEY)).toBe(text);
  });
});

it("compares content independent of key order but includes illustrative status", () => {
  const a = makeSavedPlan(demoWeek(), true, "A");
  const reversed = Object.fromEntries(
    Object.entries(a.plan).reverse(),
  ) as typeof a.plan;
  expect(samePlan(a, { plan: reversed, illustrative: true })).toBe(true);
  expect(samePlan(a, { plan: reversed, illustrative: false })).toBe(false);
});
it("keeps twelve full-size supported schedules within the library bound and preserves v1 data", () => {
  const p = demoWeek();
  const ranges = Array.from({ length: 28 }, () => ({
    ...p.partnerAvailable[0],
  }));
  p.partnerAvailable = ranges;
  p.existingCareCoverage = ranges;
  p.unpaidHelperCoverage = ranges;
  p.paidCare!.availability = ranges;
  p.offers = Array.from({ length: 10 }, (_, i) => ({
    ...p.offers[0],
    id: String(i).padEnd(100, "x"),
    title: "x".repeat(80),
  }));
  const records = Array.from({ length: 12 }, (_, i) =>
    makeSavedPlan(p, true, `Plan ${i}`),
  );
  const start = performance.now();
  const raw = serializeLibrary(records);
  const decoded = parseLibrary(raw);
  console.log(
    `12-plan storage check: ${raw.length} characters, ${Math.round(performance.now() - start)} ms serialize+parse`,
  );
  expect(decoded).toEqual(records);
  expect(raw.length).toBeLessThan(MAX_LIBRARY_CHARS);
  expect(JSON.parse(raw).libraryVersion).toBe(1);
});
