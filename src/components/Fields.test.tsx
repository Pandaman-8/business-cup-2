// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import Disclosure from "./Disclosure";
import { MoneyField, DayTimeRange } from "./Fields";
afterEach(cleanup);
describe("Money entry synchronization", () => {
  it("retains incomplete drafts while navigating and receives external values", () => {
    function Harness() {
      const [value, setValue] = useState(1800),
        [visible, setVisible] = useState(true);
      return (
        <>
          <div hidden={!visible}>
            <MoneyField label="Pay" value={value} onChange={setValue} />
          </div>
          <button onClick={() => setVisible(!visible)}>Navigate</button>
          <button onClick={() => setValue(2300)}>Load</button>
          <output>{String(value)}</output>
        </>
      );
    }
    render(<Harness />);
    const input = screen.getByLabelText("Pay") as HTMLInputElement;
    for (const text of ["12.", "12.3", ".", ""]) {
      fireEvent.change(input, { target: { value: text } });
      expect(input.value).toBe(text);
      fireEvent.click(screen.getByText("Navigate"));
      fireEvent.click(screen.getByText("Navigate"));
      expect(input.value).toBe(text);
    }
    fireEvent.click(screen.getByText("Load"));
    expect(input.value).toBe("23.00");
  });
  it("replaces drafts when reset/load remounts the same numeric value", () => {
    const props = { label: "Rate", value: 1800, onChange: () => {} };
    const { rerender } = render(<MoneyField {...props} key="before" />);
    fireEvent.change(screen.getByLabelText("Rate"), {
      target: { value: "18." },
    });
    rerender(<MoneyField {...props} key="after" />);
    expect((screen.getByLabelText("Rate") as HTMLInputElement).value).toBe(
      "18.00",
    );
  });
  it("updates native time inputs through input events and associates errors", () => {
    let updated = "";
    render(
      <DayTimeRange
        label="Shift"
        week="2026-11-16"
        range={{ start: "2026-11-21T09:00", end: "2026-11-21T17:00" }}
        onChange={(r) => {
          updated = r.start;
        }}
        issue="Use 15-minute increments."
      />,
    );
    const input = screen.getByLabelText("Shift start time");
    fireEvent.input(input, { target: { value: "10:15" } });
    expect(updated).toBe("2026-11-21T10:15");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(
      screen
        .getByRole("group", { name: "Shift" })
        .getAttribute("aria-describedby"),
    ).toBeTruthy();
  });
});

describe("Disclosure error recovery", () => {
  it("stays open when the input becomes valid and follows explicit mode changes", () => {
    const { rerender } = render(
      <Disclosure attention>
        <summary>Settings</summary>
        <input aria-label="Value" />
      </Disclosure>,
    );
    const group = screen.getByRole("group") as HTMLDetailsElement;
    expect(group.open).toBe(true);
    rerender(
      <Disclosure attention={false}>
        <summary>Settings</summary>
        <input aria-label="Value" />
      </Disclosure>,
    );
    expect(group.open).toBe(true);
    rerender(
      <Disclosure expanded>
        <summary>Settings</summary>
        <input aria-label="Value" />
      </Disclosure>,
    );
    expect(group.open).toBe(true);
    rerender(
      <Disclosure expanded={false}>
        <summary>Settings</summary>
        <input aria-label="Value" />
      </Disclosure>,
    );
    expect(group.open).toBe(false);
  });
});
