import Disclosure from "./Disclosure";
import { useState } from "react";
import type { Issue, PlanInput, ShiftOffer } from "../domain/types";
import {
  DaySelector,
  DayTimeRange,
  Field,
  MoneyField,
  NumberField,
} from "./Fields";
import { money, payForMinutes } from "../domain/money";
import { localMillis, shiftDate } from "../domain/time";
import { DAYS, careForShift } from "../ui/planAdapter";
export type FormProps = {
  plan: PlanInput;
  change: (p: PlanInput) => void;
  issues: Issue[];
  advanced: boolean;
};
export function Limits({ plan, change, issues }: Omit<FormProps, "advanced">) {
  const error = (p: string) => issues.find((i) => i.path === p)?.message;
  return (
    <div className="grid-two">
      <NumberField
        label="Maximum extra shifts"
        min="0"
        max="10"
        step="1"
        value={plan.maxAdditionalShifts}
        issue={error("maxAdditionalShifts")}
        onChange={(maxAdditionalShifts) =>
          change({ ...plan, maxAdditionalShifts })
        }
      />
      <Field
        label="Maximum work hours (optional)"
        type="number"
        min="0"
        max="168"
        step="0.25"
        placeholder="No limit"
        value={
          plan.maxAdditionalWorkMinutes === null
            ? ""
            : plan.maxAdditionalWorkMinutes / 60
        }
        issue={error("maxAdditionalWorkMinutes")}
        onChange={(e) =>
          change({
            ...plan,
            maxAdditionalWorkMinutes:
              e.target.value === "" ? null : Number(e.target.value) * 60,
          })
        }
      />
    </div>
  );
}
export default function ShiftOffersForm({
  plan,
  change,
  issues,
  advanced,
}: FormProps) {
  const [day, setDay] = useState(shiftDate(plan.weekStart, 5));
  const patch = (id: string, value: Partial<ShiftOffer>) =>
    change({
      ...plan,
      offers: plan.offers.map((s) => (s.id === id ? { ...s, ...value } : s)),
    });
  return (
    <>
      <header className="page-heading">
        <h1>Which shifts are you considering?</h1>
        <p>Start with the work you could take. We’ll compare what you keep.</p>
      </header>
      {plan.offers.map((s, i) => {
        const error = (key: string) =>
          issues.find((x) => x.path === `offers.${i}.${key}`)?.message;
        const duration =
          (localMillis(s.work.end) - localMillis(s.work.start)) / 60000;
        const overlaps = plan.offers.some((other) => {
          if (other.id === s.id) return false;
          try {
            const a = careForShift(s),
              b = careForShift(other);
            return a.start < b.end && a.end > b.start;
          } catch {
            return false;
          }
        });
        return (
          <article
            className="shift-card"
            key={s.id}
            aria-label={`Shift ${i + 1}`}
          >
            <div className="row-between">
              <h2>{s.title}</h2>
              <button
                type="button"
                className="text-button"
                aria-label={`Remove shift ${i + 1}`}
                onClick={() =>
                  change({
                    ...plan,
                    offers: plan.offers.filter((x) => x.id !== s.id),
                  })
                }
              >
                Remove
              </button>
            </div>
            <DayTimeRange
              label={`Shift ${i + 1}`}
              range={s.work}
              week={plan.weekStart}
              issue={error("work")}
              onChange={(work) => {
                const dow =
                  (new Date(work.start.slice(0, 10) + "T12:00Z").getUTCDay() +
                    6) %
                  7;
                const title = DAYS.some((d) => s.title === `${d} shift`)
                  ? `${DAYS[dow]} shift`
                  : s.title;
                patch(s.id, { work, title });
                setDay(work.start.slice(0, 10));
              }}
            />
            <div className="pay-row">
              <MoneyField
                label={`Shift ${i + 1} hourly pay ($)`}
                value={s.hourlyPayCents}
                issue={error("hourlyPayCents")}
                onChange={(hourlyPayCents) => patch(s.id, { hourlyPayCents })}
              />
              {Number.isFinite(duration) &&
                duration > 0 &&
                Number.isFinite(s.hourlyPayCents) && (
                  <p className="gross-preview">
                    <strong>
                      {money(payForMinutes(s.hourlyPayCents, duration))}
                    </strong>
                    <span>{duration / 60} hours · before costs</span>
                  </p>
                )}
            </div>
            <Disclosure
              expanded={advanced}
              attention={
                !!error("commuteBeforeMinutes") ||
                !!error("commuteAfterMinutes") ||
                !!error("title")
              }
            >
              <summary>
                Commute & shift details
                {s.commuteBeforeMinutes + s.commuteAfterMinutes > 0
                  ? ` · ${s.commuteBeforeMinutes + s.commuteAfterMinutes} min travel`
                  : ""}
              </summary>
              <p className="hint">
                Childcare needs to cover your commute, too. Use 15-minute
                increments.
              </p>
              <div className="grid-two">
                <NumberField
                  label={`Shift ${i + 1} commute before (minutes)`}
                  min="0"
                  step="15"
                  value={s.commuteBeforeMinutes}
                  issue={error("commuteBeforeMinutes")}
                  onChange={(commuteBeforeMinutes) =>
                    patch(s.id, { commuteBeforeMinutes })
                  }
                />
                <NumberField
                  label={`Shift ${i + 1} commute after (minutes)`}
                  min="0"
                  step="15"
                  value={s.commuteAfterMinutes}
                  issue={error("commuteAfterMinutes")}
                  onChange={(commuteAfterMinutes) =>
                    patch(s.id, { commuteAfterMinutes })
                  }
                />
              </div>
              <Field
                label={`Shift ${i + 1} name`}
                maxLength={80}
                value={s.title}
                issue={error("title")}
                onChange={(e) => patch(s.id, { title: e.target.value })}
              />
            </Disclosure>
            {overlaps && (
              <p className="notice">
                This overlaps another shift or its commute. You can compare
                them, but cannot take both.
              </p>
            )}
          </article>
        );
      })}
      {plan.offers.length < 10 ? (
        <div className="add-shift">
          <DaySelector
            label="Day for a new shift"
            week={plan.weekStart}
            value={day}
            onChange={setDay}
          />
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              const index = Math.round(
                (Date.parse(day) - Date.parse(plan.weekStart)) / 86400000,
              );
              change({
                ...plan,
                offers: [
                  ...plan.offers,
                  {
                    id: crypto.randomUUID(),
                    title: `${DAYS[index]} shift`,
                    work: { start: day + "T09:00", end: day + "T17:00" },
                    hourlyPayCents: NaN,
                    travelCostCents: 0,
                    commuteBeforeMinutes: 0,
                    commuteAfterMinutes: 0,
                  },
                ],
              });
            }}
          >
            + {plan.offers.length ? "Add another shift" : "Add a shift"}
          </button>
        </div>
      ) : (
        <p className="notice">
          You have 10 shifts. Remove one to compare a different offer.
        </p>
      )}
      <Disclosure
        className="section-disclosure"
        expanded={advanced}
        attention={issues.some((i) => i.path.startsWith("maxAdditional"))}
      >
        <summary>
          How much extra work?{" "}
          <span>
            Up to {plan.maxAdditionalShifts}{" "}
            {plan.maxAdditionalShifts === 1 ? "shift" : "shifts"}
          </span>
        </summary>
        <p className="hint">
          We can recommend a combination of shifts, within your limits.
        </p>
        <Limits plan={plan} change={change} issues={issues} />
      </Disclosure>
      <p className="hint">
        Times are local to your selected time zone. Use :00, :15, :30 or :45.
      </p>
    </>
  );
}
