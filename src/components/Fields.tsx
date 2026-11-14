import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { parseMoney } from "../domain/money";
import type { Issue, TimeRange } from "../domain/types";
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
  return (
    <label className="field">
      <span>{label}</span>
      <input
        {...props}
        onInput={
          props.type === "datetime-local" || props.type === "date"
            ? (e) => props.onChange?.({ ...e, target: e.currentTarget })
            : undefined
        }
        aria-invalid={Boolean(issue)}
      />
      {hint && <small>{hint}</small>}
      {issue && <small className="error">{issue}</small>}
    </label>
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
  const [text, setText] = useState(
    Number.isFinite(value) ? (value / 100).toFixed(2) : "",
  );
  return (
    <Field
      label={label}
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseMoney(e.target.value));
      }}
      issue={issue}
    />
  );
}
export function NumberField({
  label,
  value,
  onChange,
  ...props
}: { label: string; value: number; onChange: (n: number) => void } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
>) {
  return (
    <Field
      {...props}
      label={label}
      type="number"
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? NaN : Number(e.target.value))
      }
    />
  );
}
export function Windows({
  title,
  description,
  ranges,
  onChange,
  week,
  issues,
  path,
}: {
  title: string;
  description: string;
  ranges: TimeRange[];
  onChange: (v: TimeRange[]) => void;
  week: string;
  issues: Issue[];
  path: string;
}) {
  return (
    <fieldset className="windows">
      <legend>
        {title}
        <span className="count">{ranges.length}</span>
      </legend>
      <p className="hint">{description}</p>
      {ranges.map((r, i) => (
        <div className="window" key={i}>
          <Field
            label={`${title} ${i + 1} start`}
            type="datetime-local"
            step="900"
            value={r.start}
            onChange={(e) =>
              onChange(
                ranges.map((old, j) =>
                  i === j ? { ...old, start: e.target.value } : old,
                ),
              )
            }
          />
          <Field
            label={`${title} ${i + 1} end`}
            type="datetime-local"
            step="900"
            value={r.end}
            onChange={(e) =>
              onChange(
                ranges.map((old, j) =>
                  i === j ? { ...old, end: e.target.value } : old,
                ),
              )
            }
          />
          <button
            className="icon-button"
            type="button"
            aria-label={`Remove ${title.toLowerCase()} window ${i + 1}`}
            onClick={() => onChange(ranges.filter((_, j) => j !== i))}
          >
            ×
          </button>
          {issues
            .filter((x) => x.path === `${path}.${i}`)
            .map((x) => (
              <p className="error full-width" key={x.path}>
                {x.message}
              </p>
            ))}
        </div>
      ))}
      {ranges.length === 0 && (
        <p className="empty-inline">No availability entered</p>
      )}
      <button
        className="text-button"
        type="button"
        disabled={ranges.length >= 28}
        onClick={() =>
          onChange([
            ...ranges,
            { start: `${week}T09:00`, end: `${week}T17:00` },
          ])
        }
      >
        + Add {title.toLowerCase()} window
      </button>
    </fieldset>
  );
}
