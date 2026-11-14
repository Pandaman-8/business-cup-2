import Disclosure from "./Disclosure";
import { useState } from "react";
import type { PlanInput, Issue } from "../domain/types";
import { ZONES } from "../domain/time";
import { dateLabel, moveWeek } from "../ui/planAdapter";
import { Field, SelectField } from "./Fields";
export default function WeekSettings({
  plan,
  replace,
  advanced,
  issues,
}: {
  plan: PlanInput;
  replace: (p: PlanInput, note: string) => void;
  advanced: boolean;
  issues: Issue[];
}) {
  const [date, setDate] = useState(plan.weekStart),
    [error, setError] = useState("");
  function apply(action: "move" | "clear") {
    try {
      const next = moveWeek(plan, date, action);
      replace(
        next,
        action === "move"
          ? "Schedule moved to the same weekdays. Reconfirm every copied care window."
          : "New week selected. Shifts and care windows cleared.",
      );
      setError("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not change this week. Check the dates and your inputs.",
      );
    }
  }
  return (
    <Disclosure
      className="week-settings"
      expanded={advanced}
      attention={
        !!error ||
        issues.some((i) => i.path === "weekStart" || i.path === "timeZone")
      }
    >
      <summary>
        Week of {dateLabel(plan.weekStart)}{" "}
        <span>
          ·{" "}
          {plan.timeZone
            .replace("America/", "")
            .replace("Pacific/", "")
            .replaceAll("_", " ")}{" "}
          · Change
        </span>
      </summary>
      <div className="grid-two">
        <Field
          label="Week starting Monday"
          type="date"
          value={date}
          issue={
            error ||
            issues.find((i) => i.path === "weekStart" || i.path === "timeZone")
              ?.message
          }
          onChange={(e) => {
            setDate(e.target.value);
            setError("");
          }}
        />
        <SelectField
          label="Time zone"
          value={plan.timeZone}
          onChange={(e) => {
            const next = { ...plan, timeZone: e.target.value };
            try {
              replace(
                moveWeek(next, next.weekStart, "move"),
                "Time zone updated. Times remain local.",
              );
              setError("");
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "This time zone is not available for the selected week.",
              );
            }
          }}
        >
          {ZONES.map((z) => (
            <option key={z} value={z}>
              {z
                .replace("America/", "")
                .replace("Pacific/", "")
                .replaceAll("_", " ")}
            </option>
          ))}
        </SelectField>
      </div>
      {date !== plan.weekStart && (
        <div className="week-confirm">
          <p>
            Choose what to bring to the new week. Your current schedule stays
            unchanged until you apply.
          </p>
          <div className="actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => apply("move")}
            >
              Move shifts & care
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => apply("clear")}
            >
              Clear schedule & change week
            </button>
          </div>
        </div>
      )}
      <p className="hint">
        Monday–Sunday weeks. Weeks with a daylight saving clock change are not
        supported.
      </p>
    </Disclosure>
  );
}
