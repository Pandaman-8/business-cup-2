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
import userEvent from "@testing-library/user-event";
import { optimize } from "./domain/optimizer";
import type { PlanInput } from "./domain/types";
import { STORAGE_KEY } from "./domain/persistence";
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
beforeEach(() => {
  vi.stubGlobal("Worker", TestWorker);
  vi.stubGlobal("scrollTo", () => {});
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const click = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));
const input = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label, { exact: true }), {
    target: { value },
  });
const result = async (amount: string) =>
  waitFor(() =>
    expect(screen.getByTestId("net-gain").textContent).toBe(amount),
  );
describe("V2 full user journeys with the real engine", () => {
  it("runs the sample, recalculates caps without stale output, removes partner care and saves/restores", async () => {
    render(<App />);
    click("Try an example");
    await result("$98.40");
    expect(screen.getByText("$75.20 more")).toBeTruthy();
    const region = screen.getByRole("region", { name: "Your recommendation" });
    const cap = within(region).getByLabelText("Maximum extra shifts");
    fireEvent.change(cap, { target: { value: "2" } });
    expect(screen.queryByTestId("net-gain")).toBeNull();
    await result("$121.60");
    expect(screen.getByText("$23.20 more")).toBeTruthy();
    click("2 Childcare");
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /My partner/,
      }),
    );
    click("4 Your result");
    await result("$23.20");
    expect(
      screen.getByText("This shift needs more childcare coverage."),
    ).toBeTruthy();
    click("Save this week");
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    click("Reset");
    await result("$98.40");
    fireEvent.click(screen.getByText("Saved week & privacy"));
    click("Load saved week");
    await result("$23.20");
  });
  it("compares custom Monday work with explicit care and preserves partial money drafts across steps/modes", async () => {
    render(<App />);
    click("Compare my shifts");
    const firstDay = (
      screen.getByLabelText("Day for a new shift") as HTMLSelectElement
    ).options[0].value;
    input("Day for a new shift", firstDay);
    click("+ Add a shift");
    input("Shift 1 end time", "13:00");
    input("Shift 1 hourly pay ($)", "25.");
    click("ShiftMargin home");
    click("Continue my current plan");
    expect(
      (screen.getByLabelText("Shift 1 hourly pay ($)") as HTMLInputElement)
        .value,
    ).toBe("25.");
    click("Advanced Planning");
    click("Quick Compare");
    expect(
      (screen.getByLabelText("Shift 1 hourly pay ($)") as HTMLInputElement)
        .value,
    ).toBe("25.");
    input("Shift 1 hourly pay ($)", "25.50");
    click("Continue to childcare");
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /My partner/,
      }),
    );
    const preset = screen.getByRole("checkbox", {
      name: /Available for Monday shift/,
    });
    fireEvent.click(preset);
    click("Continue to costs");
    input("Monday shift travel ($)", "6.25");
    input("Estimated withholding (%)", "10");
    click("Compare my options");
    await result("$85.55");
    click("Edit my week");
    expect(
      (screen.getByLabelText("Shift 1 hourly pay ($)") as HTMLInputElement)
        .value,
    ).toBe("25.50");
  });
  it("does not invent care and keeps the unknown-care path useful", async () => {
    render(<App />);
    click("Compare my shifts");
    click("+ Add a shift");
    input("Shift 1 hourly pay ($)", "20");
    click("Continue to childcare");
    click("I’m not sure yet");
    click("Continue to costs");
    click("Compare my options");
    await result("$0.00");
    expect(
      screen.getByRole("heading", { name: "No covered shift yet." }),
    ).toBeTruthy();
    expect(screen.getByText("Care missing:")).toBeTruthy();
  });
  it("blocks invalid pay, limits offers to ten and preserves the selected new-shift weekday", () => {
    render(<App />);
    click("Compare my shifts");
    click("+ Add a shift");
    click("Continue to childcare");
    expect(screen.getByRole("alert").textContent).toContain("highlighted");
    input("Shift 1 hourly pay ($)", "20");
    for (let i = 1; i < 10; i++) click("+ Add another shift");
    expect(
      screen.queryByRole("button", { name: "+ Add another shift" }),
    ).toBeNull();
    expect(
      screen.getByText(
        "You have 10 shifts. Remove one to compare a different offer.",
      ),
    ).toBeTruthy();
    expect(
      (screen.getByLabelText("Shift 10 day") as HTMLSelectElement)
        .selectedOptions[0].textContent,
    ).toContain("Saturday");
  });
  it("preserves invalid what-if input for correction instead of unmounting it", async () => {
    render(<App />);
    click("Try an example");
    await result("$98.40");
    const region = screen.getByRole("region", { name: "Your recommendation" });
    const cap = within(region).getByLabelText("Maximum extra shifts");
    fireEvent.change(cap, { target: { value: "" } });
    expect(screen.queryByTestId("net-gain")).toBeNull();
    expect(within(region).getByLabelText("Maximum extra shifts")).toBe(cap);
    fireEvent.change(cap, { target: { value: "2" } });
    await result("$121.60");
  });
});

describe("Keyboard navigation", () => {
  it("tabs through entry, activates the main action, and skips hidden steps", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("link", { name: "Skip to content" }),
    );
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "ShiftMargin home" }),
    );
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Compare my shifts" }),
    );
    await user.keyboard("{Enter}");
    expect(document.activeElement?.textContent).toBe(
      "Which shifts are you considering?",
    );
    const focused: string[] = [];
    for (let i = 0; i < 8; i++) {
      await user.tab();
      const el = document.activeElement as HTMLElement;
      expect(el.closest("[hidden]")).toBeNull();
      focused.push(el.textContent ?? el.getAttribute("aria-label") ?? "");
    }
    expect(focused.some((t) => t.includes("Add a shift"))).toBe(true);
  });
});
