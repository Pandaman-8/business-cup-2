// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import App from "./App";
import { optimize } from "./domain/optimizer";
import { demoWeek } from "./data/demoWeek";
import type { PlanInput } from "./domain/types";
import { STORAGE_KEY, serializeWeek } from "./domain/persistence";
import {
  LIBRARY_KEY,
  DEMO_KEY,
  makeSavedPlan,
  parseLibrary,
  serializeLibrary,
  setDemo,
} from "./storage/planLibrary";
import { moveWeek } from "./ui/planAdapter";
class TestWorker {
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror = null;
  cancelled = false;
  postMessage(p: PlanInput) {
    queueMicrotask(() => {
      if (!this.cancelled) this.onmessage?.({ data: { result: optimize(p) } });
    });
  }
  terminate() {
    this.cancelled = true;
  }
}
// jsdom lacks native dialog methods; browser QA verifies real modal behavior.
Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
  configurable: true,
  value: function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  },
});
Object.defineProperty(HTMLDialogElement.prototype, "close", {
  configurable: true,
  value: function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  },
});
beforeEach(() => {
  vi.stubGlobal("Worker", TestWorker);
  vi.stubGlobal("scrollTo", () => {});
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const click = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));
const modal = () => screen.getByRole("dialog");
const inDialog = (name: string) =>
  fireEvent.click(within(modal()).getByRole("button", { name }));
const result = (amount: string) =>
  waitFor(() =>
    expect(screen.getByTestId("net-gain").textContent).toBe(amount),
  );
const namePlan = (name: string) =>
  fireEvent.change(within(modal()).getByLabelText("Plan name"), {
    target: { value: name },
  });
function seed() {
  setDemo(localStorage, true);
  const a = makeSavedPlan(demoWeek(), true, "One shift");
  const p = demoWeek();
  p.maxAdditionalShifts = 2;
  const b = makeSavedPlan(
    moveWeek(p, "2026-11-23", "move"),
    true,
    "Next week, two shifts",
  );
  localStorage.setItem(LIBRARY_KEY, serializeLibrary([a, b]));
  return [a, b];
}
describe("V2.3 saved-plan trust", () => {
  const two = async () => {
    click("Change limit");
    click("Up to two");
    click("4 Your result");
    await result("$121.60");
  };
  it("protects reset with cancel, then saves before continuing", async () => {
    render(<App />);
    click("Try an example");
    await result("$98.40");
    await two();
    click("Reset");
    expect(within(modal()).getByText("You have unsaved changes.")).toBeTruthy();
    inDialog("Cancel");
    await result("$121.60");
    click("Reset");
    inDialog("Save current plan");
    await result("$98.40");
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY)!).plan.maxAdditionalShifts,
    ).toBe(2);
  });
  it("discards only on explicit choice and protects starting a new comparison", async () => {
    render(<App />);
    click("Try an example");
    await result("$98.40");
    await two();
    click("ShiftMargin home");
    click("Compare my shifts");
    inDialog("Cancel");
    click("Continue my current plan");
    await result("$121.60");
    click("ShiftMargin home");
    click("Compare my shifts");
    inDialog("Discard changes and open");
    expect(screen.getByRole("button", { name: "+ Add a shift" })).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
  it("saves through the existing upgrade flow before opening the pending plan", async () => {
    const [target] = seed();
    localStorage.removeItem(DEMO_KEY);
    localStorage.setItem(STORAGE_KEY, serializeWeek(demoWeek(), true));
    render(<App />);
    click("Try an example");
    await result("$98.40");
    await two();
    click("Reset");
    inDialog("Save current plan");
    inDialog("Keep both with Plus");
    inDialog("Try Plus Demo — No payment required");
    namePlan("Two for later");
    inDialog("Save to library");
    await result("$98.40");
    expect(
      parseLibrary(localStorage.getItem(LIBRARY_KEY)).find(
        (p) => p.name === "Two for later",
      )?.plan.maxAdditionalShifts,
    ).toBe(2);
    expect(
      parseLibrary(localStorage.getItem(LIBRARY_KEY)).find(
        (p) => p.id === target.id,
      ),
    ).toBeTruthy();
  });
  it("cancelling an upgrade cancels pending navigation and preserves edited inputs", async () => {
    localStorage.setItem(STORAGE_KEY, serializeWeek(demoWeek(), true));
    render(<App />);
    click("Try an example");
    await result("$98.40");
    await two();
    click("Reset");
    inDialog("Save current plan");
    inDialog("Keep both with Plus");
    inDialog("Continue with Free");
    await result("$121.60");
    click("Save this week");
    inDialog("Replace Free saved week");
    await result("$121.60");
  });
  it("keeps unsaved work when a save fails and permits cancellation", async () => {
    render(<App />);
    click("Try an example");
    await result("$98.40");
    await two();
    click("Reset");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    inDialog("Save current plan");
    expect(within(modal()).getByRole("alert").textContent).toContain(
      "Could not save",
    );
    inDialog("Cancel");
    await result("$121.60");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
  it("does not treat corrupt storage as proof that a current plan is saved", async () => {
    localStorage.setItem(STORAGE_KEY, "{");
    localStorage.setItem(LIBRARY_KEY, "{");
    render(<App />);
    click("Try an example");
    await result("$98.40");
    await two();
    click("Reset");
    inDialog("Cancel");
    click("Save this week");
    expect(within(modal()).getByText(/unreadable saved data/)).toBeTruthy();
    inDialog("Cancel");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{");
    expect(localStorage.getItem(LIBRARY_KEY)).toBe("{");
    await result("$121.60");
  });
  it("checks current storage on repeated save and rejects cross-tab replacement", async () => {
    render(<App />);
    click("Try an example");
    await result("$98.40");
    click("Save this week");
    const other = demoWeek();
    other.maxAdditionalShifts = 2;
    localStorage.setItem(STORAGE_KEY, serializeWeek(other, true));
    click("Save this week");
    const latest = serializeWeek({ ...other, maxAdditionalShifts: 0 }, true);
    localStorage.setItem(STORAGE_KEY, latest);
    inDialog("Replace Free saved week");
    expect(within(modal()).getByRole("alert").textContent).toContain(
      "another tab",
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBe(latest);
  });
  it("includes the illustrative flag in plan identity", async () => {
    localStorage.setItem(STORAGE_KEY, serializeWeek(demoWeek(), false));
    render(<App />);
    click("Try an example");
    await result("$98.40");
    click("Save this week");
    expect(within(modal()).getByText("Want to keep both plans?")).toBeTruthy();
  });
  it("does not interrupt opening when current inputs already match a saved snapshot", async () => {
    seed();
    render(<App />);
    click("Try an example");
    await result("$98.40");
    click("Plan library");
    inDialog("Open Next week, two shifts");
    expect(screen.queryByRole("dialog")).toBeNull();
    await result("$121.60");
  });
  it("protects an unsaved plan when opening a library record and rechecks a changed target", async () => {
    const plans = seed();
    render(<App />);
    click("Try an example");
    await result("$98.40");
    await two();
    click("Plan library");
    inDialog("Open One shift");
    expect(within(modal()).getByText("You have unsaved changes.")).toBeTruthy();
    localStorage.setItem(LIBRARY_KEY, serializeLibrary([plans[1]]));
    inDialog("Discard changes and open");
    await result("$121.60");
    expect(
      screen.getAllByText(/This library plan changed/).length,
    ).toBeGreaterThan(0);
  });
  it("protects invalid money drafts without serializing them", async () => {
    render(<App />);
    click("Try an example");
    await result("$98.40");
    click("Edit my week");
    fireEvent.change(screen.getByLabelText("Shift 1 hourly pay ($)"), {
      target: { value: "28.." },
    });
    click("Reset");
    expect(
      (
        within(modal()).getByRole("button", {
          name: "Save current plan",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    inDialog("Cancel");
    expect(
      (screen.getByLabelText("Shift 1 hourly pay ($)") as HTMLInputElement)
        .value,
    ).toBe("28..");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
  it("warns on reload only while significant work lacks a persisted copy", async () => {
    render(<App />);
    click("Try an example");
    await result("$98.40");
    const before = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(before);
    expect(before.defaultPrevented).toBe(true);
    click("Save this week");
    const saved = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(saved);
    expect(saved.defaultPrevented).toBe(false);
    localStorage.removeItem(STORAGE_KEY);
    const removed = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(removed);
    expect(removed.defaultPrevented).toBe(true);
  });
  it("does not duplicate an identical library plan", async () => {
    seed();
    render(<App />);
    click("Try an example");
    await result("$98.40");
    const raw = localStorage.getItem(LIBRARY_KEY);
    click("Save another plan");
    namePlan("Duplicate name");
    inDialog("Save to library");
    expect(
      within(modal()).getByText("This plan is already in your library."),
    ).toBeTruthy();
    expect(localStorage.getItem(LIBRARY_KEY)).toBe(raw);
  });
  it("reuses a saved plan directly, preserves assumptions and clears offers", async () => {
    seed();
    render(<App />);
    click("Plan library");
    inDialog("Use One shift for next week");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain(
      "Reconfirm every copied care window",
    );
    expect(screen.queryByLabelText("Shift 1 hourly pay ($)")).toBeNull();
    click("+ Add a shift");
    expect(
      (screen.getByLabelText("Shift 1 day") as HTMLSelectElement).value,
    ).toBe("2026-11-28");
    expect(
      parseLibrary(localStorage.getItem(LIBRARY_KEY))[0].plan.weekStart,
    ).toBe("2026-11-16");
  });
  it("guards library reuse and preserves the edited plan when cancelled", async () => {
    seed();
    render(<App />);
    click("Try an example");
    await result("$98.40");
    await two();
    click("Plan library");
    inDialog("Use One shift for next week");
    inDialog("Cancel");
    await result("$121.60");
  });
  it("rejects a saved next-week transition into DST without changing stored data", () => {
    setDemo(localStorage, true);
    const item = makeSavedPlan(
      moveWeek(demoWeek(), "2026-02-23", "move"),
      true,
      "Before DST",
    );
    const raw = serializeLibrary([item]);
    localStorage.setItem(LIBRARY_KEY, raw);
    render(<App />);
    click("Plan library");
    inDialog("Use Before DST for next week");
    expect(within(modal()).getByRole("alert").textContent).toContain(
      "daylight saving",
    );
    expect(localStorage.getItem(LIBRARY_KEY)).toBe(raw);
  });
  it("guards changing the calendar week and resumes only after confirmation", async () => {
    render(<App />);
    click("Try an example");
    await result("$98.40");
    click("Edit my week");
    fireEvent.change(screen.getByLabelText("Week starting Monday"), {
      target: { value: "2026-11-23" },
    });
    click("Clear schedule & change week");
    inDialog("Cancel");
    expect(screen.getByLabelText("Shift 1 hourly pay ($)")).toBeTruthy();
    click("Clear schedule & change week");
    inDialog("Discard changes and open");
    expect(screen.queryByLabelText("Shift 1 hourly pay ($)")).toBeNull();
  });
  it("saves before restoring the previous Free version without losing either current work or the intended open", async () => {
    localStorage.setItem(STORAGE_KEY, serializeWeek(demoWeek(), true));
    render(<App />);
    click("Try an example");
    await result("$98.40");
    await two();
    fireEvent.click(screen.getByText("Saved week & privacy"));
    click("Load saved week");
    inDialog("Save current plan");
    inDialog("Replace Free saved week");
    await result("$98.40");
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY)!).plan.maxAdditionalShifts,
    ).toBe(2);
  });
  it("calculates the independent $55.12 case and rejects unconfirmed sitter hours", async () => {
    render(<App />);
    click("Compare my shifts");
    const day = screen.getByLabelText(
      "Day for a new shift",
    ) as HTMLSelectElement;
    fireEvent.change(day, { target: { value: day.options[5].value } });
    click("+ Add a shift");
    const input = (label: string, value: string) =>
      fireEvent.change(screen.getByLabelText(label, { exact: true }), {
        target: { value },
      });
    input("Shift 1 start time", "10:00");
    input("Shift 1 end time", "14:00");
    input("Shift 1 hourly pay ($)", "31.75");
    click("Continue to childcare");
    fireEvent.click(screen.getByRole("checkbox", { name: /Paid sitter/ }));
    click("Continue to costs");
    input("Sitter hourly rate ($)", "14");
    input("Estimated withholding (%)", "12.5");
    click("Compare my options");
    await result("$0.00");
    click("2 Childcare");
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Available for Saturday shift/ }),
    );
    click("4 Your result");
    await result("$55.12");
  });
});
