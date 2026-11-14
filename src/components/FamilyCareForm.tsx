import Disclosure from "./Disclosure";
import { useState } from "react";
import type { TimeRange } from "../domain/types";
import { rangeLabel } from "../domain/time";
import { careForShift } from "../ui/planAdapter";
import type { FormProps } from "./ShiftOffersForm";
import { DayTimeRange, NumberField } from "./Fields";
type Source =
  | "partnerAvailable"
  | "unpaidHelperCoverage"
  | "existingCareCoverage"
  | "sitter";
const sources: { key: Source; title: string; description: string }[] = [
  {
    key: "partnerAvailable",
    title: "My partner",
    description: "No added childcare cost.",
  },
  {
    key: "unpaidHelperCoverage",
    title: "Family or friend",
    description: "Unpaid help from someone you know.",
  },
  {
    key: "sitter",
    title: "Paid sitter",
    description: "You’ll enter their rate in the next step.",
  },
  {
    key: "existingCareCoverage",
    title: "Care is already arranged",
    description: "Already paid for or free. No added cost.",
  },
];
export default function FamilyCareForm({
  plan,
  change,
  issues,
  advanced,
}: FormProps) {
  const [active, setActive] = useState<Source[]>(() =>
    sources
      .filter((s) =>
        s.key === "sitter" ? !!plan.paidCare : plan[s.key].length > 0,
      )
      .map((s) => s.key),
  );
  const [unsure, setUnsure] = useState(false);
  const setRanges = (key: Source, ranges: TimeRange[]) =>
    change(
      key === "sitter"
        ? { ...plan, paidCare: { ...plan.paidCare!, availability: ranges } }
        : {
            ...plan,
            [key]: ranges,
            ...(key === "partnerAvailable"
              ? { household: "two-adults" as const }
              : {}),
          },
    );
  return (
    <>
      <header className="page-heading">
        <h1>Who can watch your child while you’re working?</h1>
        <p>Choose everyone who can help, then confirm their hours.</p>
      </header>
      <div className="care-options">
        {sources.map((s) => (
          <label
            className={`care-option ${active.includes(s.key) ? "selected" : ""}`}
            key={s.key}
          >
            <input
              type="checkbox"
              checked={active.includes(s.key)}
              onChange={(e) => {
                setUnsure(false);
                setActive(
                  e.target.checked
                    ? [...active, s.key]
                    : active.filter((k) => k !== s.key),
                );
                if (s.key === "sitter")
                  change({
                    ...plan,
                    paidCare: e.target.checked
                      ? {
                          availability: [],
                          hourlyCostCents: NaN,
                          minBillableMinutesPerVisit: 0,
                        }
                      : null,
                  });
                else if (!e.target.checked) setRanges(s.key, []);
              }}
            />
            <span>
              <strong>{s.title}</strong>
              <small>{s.description}</small>
            </span>
          </label>
        ))}
      </div>
      <button
        type="button"
        className="text-button"
        aria-pressed={unsure}
        onClick={() => setUnsure(!unsure)}
      >
        I’m not sure yet
      </button>
      {unsure && (
        <p className="notice">
          That’s okay. We’ll show where care is still missing. We can only
          recommend shifts covered by the hours you enter.
        </p>
      )}
      {sources
        .filter((s) => active.includes(s.key))
        .map((source) => {
          const key = source.key;
          const ranges =
            key === "sitter" ? (plan.paidCare?.availability ?? []) : plan[key];
          const path = key === "sitter" ? "paidCare.availability" : key;
          return (
            <section
              className="form-section"
              key={key}
              aria-label={`${source.title} availability`}
            >
              <h2>{source.title}</h2>
              <p className="hint">
                Confirm the hours they can cover, including your commute.
              </p>
              <div className="care-presets">
                {plan.offers.map((s) => {
                  let r: TimeRange;
                  try {
                    r = careForShift(s);
                  } catch {
                    return null;
                  }
                  const checked = ranges.some(
                    (x) => x.start === r.start && x.end === r.end,
                  );
                  return (
                    <label className="check-row" key={s.id}>
                      <input
                        type="checkbox"
                        disabled={!checked && ranges.length >= 28}
                        checked={checked}
                        onChange={(e) =>
                          setRanges(
                            key,
                            e.target.checked
                              ? [...ranges, r]
                              : ranges.filter(
                                  (x) => x.start !== r.start || x.end !== r.end,
                                ),
                          )
                        }
                      />
                      <span>
                        <strong>Available for {s.title}</strong>
                        <small>{rangeLabel(r)} · including travel</small>
                      </span>
                    </label>
                  );
                })}
              </div>
              {ranges.length === 0 && (
                <p className="notice">No availability confirmed yet.</p>
              )}
              <Disclosure
                expanded={advanced}
                attention={issues.some((i) => i.path.startsWith(path))}
              >
                <summary>
                  Partial hours or other availability{" "}
                  <span>
                    {ranges.length} saved{" "}
                    {ranges.length === 1 ? "window" : "windows"}
                  </span>
                </summary>
                {ranges.map((r, i) => (
                  <div className="care-window" key={i}>
                    <div className="row-between">
                      <h3>Window {i + 1}</h3>
                      <button
                        className="text-button"
                        type="button"
                        aria-label={`Remove ${source.title} window ${i + 1}`}
                        onClick={() =>
                          setRanges(
                            key,
                            ranges.filter((_, j) => j !== i),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <DayTimeRange
                      label={`${source.title} window ${i + 1}`}
                      week={plan.weekStart}
                      range={r}
                      issue={
                        issues.find((x) => x.path === `${path}.${i}`)?.message
                      }
                      onChange={(value) =>
                        setRanges(
                          key,
                          ranges.map((old, j) => (j === i ? value : old)),
                        )
                      }
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="secondary-button"
                  disabled={ranges.length >= 28}
                  onClick={() => {
                    const date =
                      plan.offers[0]?.work.start.slice(0, 10) ?? plan.weekStart;
                    setRanges(key, [
                      ...ranges,
                      { start: date + "T09:00", end: date + "T17:00" },
                    ]);
                  }}
                >
                  + Add availability window
                </button>
              </Disclosure>
              {key === "sitter" && plan.paidCare && (
                <Disclosure
                  expanded={advanced}
                  defaultOpen={plan.paidCare.minBillableMinutesPerVisit > 0}
                  attention={issues.some(
                    (i) => i.path === "paidCare.minBillableMinutesPerVisit",
                  )}
                >
                  <summary>Does the sitter have a minimum booking?</summary>
                  <NumberField
                    label="Minimum sitter visit (minutes)"
                    min="0"
                    max="10080"
                    step="15"
                    value={plan.paidCare.minBillableMinutesPerVisit}
                    issue={
                      issues.find(
                        (i) => i.path === "paidCare.minBillableMinutesPerVisit",
                      )?.message
                    }
                    onChange={(minBillableMinutesPerVisit) =>
                      change({
                        ...plan,
                        paidCare: {
                          ...plan.paidCare!,
                          minBillableMinutesPerVisit,
                        },
                      })
                    }
                  />
                  <p className="hint">
                    Leave 0 if there is no minimum. The entire paid visit must
                    fit their available hours.
                  </p>
                </Disclosure>
              )}
            </section>
          );
        })}
      <p className="hint">
        Entering availability doesn’t book anyone. Confirm care directly before
        accepting a shift.
      </p>
    </>
  );
}
