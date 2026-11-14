import { expect, it } from "vitest";
import { demoWeek } from "../data/demoWeek";
import {
  deserializeWeek,
  nextWeekSettings,
  serializeWeek,
} from "./persistence";
it("LOCAL_ROUNDTRIP: validated settings and sample label survive serialization", () => {
  const p = demoWeek();
  const saved = deserializeWeek(serializeWeek(p, true));
  expect(saved.plan).toEqual(p);
  expect(saved.illustrative).toBe(true);
});
it("CORRUPT_STORAGE: malformed, old schema and invalid domain data are rejected", () => {
  for (const text of [
    "{",
    "null",
    "{}",
    JSON.stringify({ storageVersion: 2 }),
    JSON.stringify({
      storageVersion: 1,
      savedAt: "2026-11-14",
      illustrative: false,
      plan: { ...demoWeek(), withholdingPercent: -1 },
    }),
    "x".repeat(100001),
  ])
    expect(() => deserializeWeek(text)).toThrow();
});
it("NEXT_WEEK: reuse care, preserve rates, clear offers, do not mutate previous plan", () => {
  const p = demoWeek();
  const n = nextWeekSettings(p);
  expect(n.weekStart).toBe("2026-11-23");
  expect(n.partnerAvailable[0].start).toBe("2026-11-29T09:00");
  expect(n.paidCare?.availability[0].end).toBe("2026-11-28T17:00");
  expect(n.paidCare?.hourlyCostCents).toBe(1800);
  expect(n.offers).toEqual([]);
  expect(p).toEqual(demoWeek());
});
it("NEXT_WEEK_DST: reject transition weeks instead of moving ambiguously", () => {
  const p = {
    ...demoWeek(),
    weekStart: "2026-02-23",
    offers: [],
    partnerAvailable: [],
    paidCare: null,
  };
  expect(() => nextWeekSettings(p)).toThrow("daylight");
});
