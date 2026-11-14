// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import SavedPlanComparison from "./SavedPlanComparison";
import { makeSavedPlan, type SavedPlan } from "../storage/planLibrary";
import { demoWeek } from "../data/demoWeek";
import { optimize } from "../domain/optimizer";
import type { PlanInput } from "../domain/types";
class ControlledWorker {
  static instances: ControlledWorker[] = [];
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  terminated = false;
  input!: PlanInput;
  constructor() {
    ControlledWorker.instances.push(this);
  }
  postMessage(input: PlanInput) {
    this.input = input;
  }
  terminate() {
    this.terminated = true;
  }
  // Deliberately deliver even after termination to test the cancellation guard.
  deliver() {
    this.onmessage?.({ data: { result: optimize(this.input) } });
  }
}
function pair(two: boolean): [SavedPlan, SavedPlan] {
  const plan = demoWeek();
  if (two) plan.maxAdditionalShifts = 2;
  return [makeSavedPlan(demoWeek(), true, "A"), makeSavedPlan(plan, true, "B")];
}
beforeEach(() => {
  ControlledWorker.instances = [];
  vi.stubGlobal("Worker", ControlledWorker);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("discards late results and clears an old comparison when inputs change", () => {
  const view = render(<SavedPlanComparison plans={pair(true)} />);
  const old = [...ControlledWorker.instances];
  act(() => old.forEach((w) => w.deliver()));
  expect(screen.getByText("$23.20 more")).toBeTruthy();
  view.rerender(<SavedPlanComparison plans={pair(false)} />);
  expect(old.every((w) => w.terminated)).toBe(true);
  expect(screen.queryByText("$23.20 more")).toBeNull();
  act(() => old.forEach((w) => w.deliver()));
  expect(screen.queryByText("$23.20 more")).toBeNull();
  expect(screen.getByText("Recalculating both plans…")).toBeTruthy();
  act(() => ControlledWorker.instances.slice(2).forEach((w) => w.deliver()));
  expect(
    screen.getByText("Both plans estimate the same money kept."),
  ).toBeTruthy();
  view.unmount();
  expect(ControlledWorker.instances.every((w) => w.terminated)).toBe(true);
});
it("shows worker failures without partial results and retries with fresh workers", () => {
  render(<SavedPlanComparison plans={pair(true)} />);
  act(() => {
    ControlledWorker.instances[0].deliver();
    ControlledWorker.instances[1].onerror?.();
  });
  expect(screen.getByText(/Could not compare these plans/)).toBeTruthy();
  expect(screen.queryByText("$23.20 more")).toBeNull();
  expect(ControlledWorker.instances.every((w) => w.terminated)).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Retry comparison" }));
  expect(screen.getByText("Recalculating both plans…")).toBeTruthy();
  act(() => ControlledWorker.instances.slice(2).forEach((w) => w.deliver()));
  expect(screen.getByText("$23.20 more")).toBeTruthy();
});
