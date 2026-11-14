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
import userEvent from "@testing-library/user-event";
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
describe("Free and functional Plus Demo journeys", () => {
  it("keeps Free calculation open and requires an explicit choice before overwriting a saved week", async () => {
    render(<App />);
    click("Try an example");
    await result("$98.40");
    click("Save this week");
    const saved = localStorage.getItem(STORAGE_KEY);
    click("Save this week");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.getAllByText("This week is already saved.").length,
    ).toBeGreaterThan(0);
    click("Change limit");
    click("Up to two");
    click("4 Your result");
    await result("$121.60");
    click("Save this week");
    expect(within(modal()).getByText(/Replacing it will remove/)).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(saved);
    inDialog("Cancel");
    expect(screen.queryByRole("dialog")).toBeNull();
    click("Save this week");
    inDialog("Replace Free saved week");
    expect(screen.queryByRole("dialog")).toBeNull();
    await result("$121.60");
  });
  it("upgrades from a second save, keeps both snapshots, recalculates comparison and restores a plan", async () => {
    render(<App />);
    click("Try an example");
    await result("$98.40");
    click("Save this week");
    const original = localStorage.getItem(STORAGE_KEY);
    click("Change limit");
    click("Up to two");
    click("4 Your result");
    await result("$121.60");
    click("Save this week");
    inDialog("Keep both with Plus");
    expect(within(modal()).getByText("$5.99")).toBeTruthy();
    expect(localStorage.getItem(LIBRARY_KEY)).toBeNull();
    inDialog("Try Plus Demo — No payment required");
    expect(
      within(modal()).getByText("Plus demo active · No payment processed"),
    ).toBeTruthy();
    namePlan("Two shifts");
    inDialog("Save to library");
    const plans = parseLibrary(localStorage.getItem(LIBRARY_KEY));
    expect(plans).toHaveLength(2);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(original);
    for (const p of plans)
      fireEvent.click(
        within(modal()).getByRole("checkbox", { name: `Compare ${p.name}` }),
      );
    inDialog("Compare selected plans");
    await waitFor(() =>
      expect(within(modal()).getByText("$23.20 more")).toBeTruthy(),
    );
    expect(within(modal()).getByText("$98.40")).toBeTruthy();
    expect(within(modal()).getByText("$121.60")).toBeTruthy();
    inDialog("Back to library");
    inDialog(`Open ${plans[0].name}`);
    await result("$98.40");
  });
  it("reopens a persisted library, renames text without HTML, deletes with confirmation, and preserves different-week caveats", async () => {
    seed();
    const view = render(<App />);
    click("Plan library");
    inDialog("Rename One shift");
    namePlan('<img src=x onerror="alert(1)">');
    inDialog("Save name");
    expect(modal().querySelector("img")).toBeNull();
    expect(
      within(modal()).getByText('<img src=x onerror="alert(1)">'),
    ).toBeTruthy();
    inDialog("Close");
    view.unmount();
    render(<App />);
    click("Plan library");
    const plans = parseLibrary(localStorage.getItem(LIBRARY_KEY));
    for (const p of plans)
      fireEvent.click(
        within(modal()).getByRole("checkbox", { name: `Compare ${p.name}` }),
      );
    inDialog("Compare selected plans");
    expect(within(modal()).getByText(/Different weeks:/)).toBeTruthy();
    await waitFor(() =>
      expect(within(modal()).getByText("$23.20 more")).toBeTruthy(),
    );
    inDialog("Back to library");
    inDialog(`Delete ${plans[0].name}`);
    inDialog("Cancel");
    expect(parseLibrary(localStorage.getItem(LIBRARY_KEY))).toHaveLength(2);
    inDialog(`Delete ${plans[0].name}`);
    inDialog("Delete saved plan");
    expect(parseLibrary(localStorage.getItem(LIBRARY_KEY))).toHaveLength(1);
  });
  it("disables paid features without deleting plans or blocking Free, then unlocks the same history", async () => {
    seed();
    render(<App />);
    click("Plan library");
    const raw = localStorage.getItem(LIBRARY_KEY);
    inDialog("Turn off Plus Demo");
    expect(localStorage.getItem(DEMO_KEY)).toBeNull();
    expect(
      within(modal()).queryByRole("button", { name: "Compare selected plans" }),
    ).toBeNull();
    expect(localStorage.getItem(LIBRARY_KEY)).toBe(raw);
    inDialog("Continue with Free");
    click("Try an example");
    await result("$98.40");
    click("Plan library");
    inDialog("Try Plus Demo — No payment required");
    expect(within(modal()).getByText("One shift")).toBeTruthy();
  });
  it("recovers from corrupt library data only after explicit clearing, leaving Free and unrelated data intact", async () => {
    setDemo(localStorage, true);
    localStorage.setItem(LIBRARY_KEY, "{");
    localStorage.setItem("unrelated", "keep");
    localStorage.setItem(STORAGE_KEY, serializeWeek(demoWeek(), true));
    render(<App />);
    click("Plan library");
    expect(within(modal()).getByRole("alert").textContent).toContain(
      "Could not read",
    );
    inDialog("Clear Plus library");
    inDialog("Cancel");
    expect(localStorage.getItem(LIBRARY_KEY)).toBe("{");
    inDialog("Clear Plus library");
    inDialog("Delete all Plus plans");
    expect(localStorage.getItem(LIBRARY_KEY)).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("keep");
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    inDialog("Close");
    click("Try an example");
    await result("$98.40");
  });
  it("reports quota failure without inventing demo activation or a successful save", async () => {
    render(<App />);
    click("Plan library");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    inDialog("Try Plus Demo — No payment required");
    expect(within(modal()).getByRole("alert").textContent).toContain(
      "storage may be full",
    );
    expect(localStorage.getItem(DEMO_KEY)).toBeNull();
    expect(
      within(modal()).queryByText("Plus demo active · No payment processed"),
    ).toBeNull();
  });
  it("keeps the core usable when reading localStorage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    render(<App />);
    click("Try an example");
    await result("$98.40");
    click("Save this week");
    expect(screen.getAllByText(/Could not save/).length).toBeGreaterThan(0);
    click("Plan library");
    expect(
      within(modal()).getByRole("button", {
        name: "Try Plus Demo — No payment required",
      }),
    ).toBeTruthy();
    inDialog("Close");
    await result("$98.40");
  });
  it("keeps the previous library when a plan save runs out of storage", async () => {
    seed();
    render(<App />);
    click("Try an example");
    await result("$98.40");
    click("Change limit");
    click("Up to two");
    click("4 Your result");
    await result("$121.60");
    click("Save another plan");
    const raw = localStorage.getItem(LIBRARY_KEY);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    namePlan("Cannot fit");
    inDialog("Save to library");
    expect(within(modal()).getByRole("alert").textContent).toContain(
      "storage may be full",
    );
    expect(localStorage.getItem(LIBRARY_KEY)).toBe(raw);
    expect(
      within(modal()).queryByText(/Plan saved in this browser/),
    ).toBeNull();
  });
  it("stops a thirteenth save and allows deletion to make room", async () => {
    setDemo(localStorage, true);
    localStorage.setItem(
      LIBRARY_KEY,
      serializeLibrary(
        Array.from({ length: 12 }, (_, i) =>
          makeSavedPlan(demoWeek(), true, `Plan ${i + 1}`),
        ),
      ),
    );
    render(<App />);
    click("Try an example");
    await result("$98.40");
    click("Plan library");
    expect(
      (
        within(modal()).getByRole("button", {
          name: "Save current plan",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(within(modal()).getByText(/Library full/)).toBeTruthy();
    inDialog("Delete Plan 1");
    inDialog("Delete saved plan");
    expect(
      (
        within(modal()).getByRole("button", {
          name: "Save current plan",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });
  it("relocks a mounted comparison when Demo is disabled in another tab", async () => {
    const plans = seed();
    render(<App />);
    click("Plan library");
    for (const p of plans)
      fireEvent.click(
        within(modal()).getByRole("checkbox", { name: `Compare ${p.name}` }),
      );
    inDialog("Compare selected plans");
    await waitFor(() =>
      expect(within(modal()).getByText("$23.20 more")).toBeTruthy(),
    );
    localStorage.removeItem(DEMO_KEY);
    fireEvent(window, new StorageEvent("storage", { key: DEMO_KEY }));
    expect(within(modal()).queryByText("$23.20 more")).toBeNull();
    expect(
      screen.queryAllByText("Plus demo active · No payment processed"),
    ).toHaveLength(0);
    expect(localStorage.getItem(LIBRARY_KEY)).toBeTruthy();
  });
  it("does not overwrite a library changed by another tab", () => {
    seed();
    render(<App />);
    click("Plan library");
    inDialog("Rename One shift");
    namePlan("Changed name");
    const other = serializeLibrary([
      makeSavedPlan(demoWeek(), true, "Other tab"),
    ]);
    localStorage.setItem(LIBRARY_KEY, other);
    inDialog("Save name");
    expect(within(modal()).getByRole("alert").textContent).toContain(
      "another tab",
    );
    expect(localStorage.getItem(LIBRARY_KEY)).toBe(other);
  });
  it("focuses the dialog heading, handles Escape cancellation, and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<App />);
    const trigger = screen.getByRole("button", {
      name: "Plan library",
    });
    await user.click(trigger);
    expect(document.activeElement?.id).toBe("plan-dialog-title");
    fireEvent(
      modal(),
      new Event("cancel", { bubbles: false, cancelable: true }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
