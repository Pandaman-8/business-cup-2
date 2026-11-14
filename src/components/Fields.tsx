import { useId, useRef, useState } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { parseMoney } from "../domain/money";
import type { TimeRange } from "../domain/types";
import { shiftDate } from "../domain/time";
import { DAYS, dateLabel } from "../ui/planAdapter";
export function Field({
  label,
  hint,
  issue,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  issue?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        {...props}
        id={id}
        aria-invalid={props["aria-invalid"] ?? !!issue}
        aria-describedby={hint || issue ? id + "-help" : undefined}
        onInput={
          ["date", "time", "datetime-local"].includes(props.type ?? "")
            ? (e) => props.onChange?.({ ...e, target: e.currentTarget })
            : props.onInput
        }
      />
      {(hint || issue) && (
        <div id={id + "-help"}>
          {hint && <small>{hint}</small>}
          {issue && <small className="error">{issue}</small>}
        </div>
      )}
    </div>
  );
}
export function SelectField({
  label,
  issue,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  issue?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        {...props}
        id={id}
        aria-invalid={!!issue}
        aria-describedby={issue ? id + "-error" : undefined}
      >
        {children}
      </select>
      {issue && (
        <small id={id + "-error"} className="error">
          {issue}
        </small>
      )}
    </div>
  );
}
export function MoneyField({
  label,
  value,
  onChange,
  issue,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  issue?: string;
}) {
  const display = (n: number) =>
    Number.isFinite(n) ? (n / 100).toFixed(2) : "";
  const [text, setText] = useState(() => display(value));
  const last = useRef(value);
  // A parent update must replace the display; our own keystrokes retain their exact draft.
  if (!Object.is(last.current, value)) {
    last.current = value;
    setText(display(value));
  }
  return (
    <Field
      label={label}
      inputMode="decimal"
      autoComplete="off"
      value={text}
      placeholder="0.00"
      issue={issue}
      onChange={(e) => {
        const n = parseMoney(e.target.value);
        last.current = n;
        setText(e.target.value);
        onChange(n);
      }}
    />
  );
}
export function NumberField({
  label,
  value,
  onChange,
  issue,
  ...props
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  issue?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <Field
      {...props}
      label={label}
      issue={issue}
      type="number"
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? NaN : Number(e.target.value))
      }
    />
  );
}
export function DaySelector({
  label,
  week,
  value,
  onChange,
  includeEnd = false,
}: {
  label: string;
  week: string;
  value: string;
  onChange: (v: string) => void;
  includeEnd?: boolean;
}) {
  return (
    <SelectField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {Array.from({ length: includeEnd ? 8 : 7 }, (_, i) => {
        const date = shiftDate(week, i);
        return (
          <option key={date} value={date}>
            {DAYS[i % 7]} · {dateLabel(date)}
            {i === 7 ? " (midnight only)" : ""}
          </option>
        );
      })}
    </SelectField>
  );
}
export function DayTimeRange({
  label,
  range,
  week,
  onChange,
  issue,
}: {
  label: string;
  range: TimeRange;
  week: string;
  onChange: (r: TimeRange) => void;
  issue?: string;
}) {
  const id = useId();
  const differentDay = range.start.slice(0, 10) !== range.end.slice(0, 10);
  return (
    <fieldset
      className="range-editor"
      aria-describedby={issue ? id : undefined}
    >
      <legend className="sr-only">{label}</legend>
      <div className="time-grid">
        <DaySelector
          label={`${label} day`}
          week={week}
          value={range.start.slice(0, 10)}
          onChange={(date) => {
            const days = Math.round(
              (Date.parse(range.end.slice(0, 10)) -
                Date.parse(range.start.slice(0, 10))) /
                86400000,
            );
            onChange({
              start: date + range.start.slice(10),
              end:
                shiftDate(date, Number.isFinite(days) ? days : 0) +
                range.end.slice(10),
            });
          }}
        />
        <Field
          label={`${label} start time`}
          type="time"
          step="900"
          value={range.start.slice(11)}
          aria-invalid={!!issue}
          onChange={(e) =>
            onChange({
              ...range,
              start: range.start.slice(0, 10) + "T" + e.target.value,
            })
          }
        />
        <Field
          label={`${label} end time`}
          type="time"
          step="900"
          value={range.end.slice(11)}
          aria-invalid={!!issue}
          onChange={(e) =>
            onChange({
              ...range,
              end: range.end.slice(0, 10) + "T" + e.target.value,
            })
          }
        />
      </div>
      <details className="sub-disclosure" open={differentDay || undefined}>
        <summary>Ends on a different day{differentDay ? " · yes" : ""}</summary>
        <DaySelector
          label={`${label} end day`}
          week={week}
          includeEnd
          value={range.end.slice(0, 10)}
          onChange={(date) =>
            onChange({ ...range, end: date + range.end.slice(10) })
          }
        />
      </details>
      {issue && (
        <p className="error" id={id}>
          {issue.replace(
            "Enter real dates with the end after the start.",
            "Choose an end time after the start. For overnight hours, select the next end day.",
          )}
        </p>
      )}
    </fieldset>
  );
}
