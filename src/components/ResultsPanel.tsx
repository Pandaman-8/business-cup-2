import type {
  OptimizeResult,
  PlanInput,
  PlanResult,
  ReasonCode,
} from "../domain/types";
import { money } from "../domain/money";
import { rangeLabel } from "../domain/time";
import { comparison } from "../ui/planAdapter";
import { validate } from "../domain/validation";
import { Limits } from "./ShiftOffersForm";
const reasons: Record<ReasonCode, string> = {
  SHIFT_LIMIT: "Above your limit for extra shifts.",
  HOUR_LIMIT: "Above your work-hour limit.",
  OVERLAP: "These work or commute times overlap.",
  MISSING_CARE: "This shift needs more childcare coverage.",
  SITTER_MINIMUM:
    "The sitter cannot fit a minimum-length visit into their available hours.",
};
export const titles = (p: PlanResult, input: PlanInput) =>
  p.selectedShiftIds
    .map((id) => input.offers.find((s) => s.id === id)!.title)
    .join(" + ") || "No extra shifts";
export function CostBreakdown({ p, plan }: { p: PlanResult; plan: PlanInput }) {
  return (
    <dl className="breakdown">
      {[
        ["Gross pay", p.grossCents],
        [
          "Estimated withholding (" + plan.withholdingPercent + "%)",
          -p.withholdingCents,
        ],
        ["Childcare", -p.addedCareCents],
        ["Travel", -p.travelCents],
        ["Net money kept", p.netGainCents],
      ].map(([label, cents], i) => (
        <div className={i === 4 ? "total" : ""} key={label}>
          <dt>{label}</dt>
          <dd>{money(cents as number)}</dd>
        </div>
      ))}
    </dl>
  );
}
export default function ResultsPanel({
  result,
  plan,
  pending,
  error,
  onRetry,
  edit,
  change,
}: {
  result: OptimizeResult | null;
  plan: PlanInput;
  pending: boolean;
  error: string;
  onRetry: () => void;
  edit: (step: number) => void;
  change: (p: PlanInput) => void;
}) {
  const best = result?.best;
  const compared = result ? comparison(result) : null;
  const hasWork = !!best?.selectedShiftIds.length;
  return (
    <section aria-label="Your recommendation">
      <div role="status" aria-live="polite" aria-atomic="true">
        {best && (
          <span className="sr-only">
            {titles(best, plan)}. Estimated additional money kept:{" "}
            {money(best.netGainCents)}.
          </span>
        )}
        {pending && (
          <div className="calculation-state">
            <span className="spinner" aria-hidden="true" />
            <h1>Comparing your options…</h1>
            <p>Checking pay, costs and care for each combination.</p>
          </div>
        )}
        {error && (
          <div className="notice">
            <h1>Let’s check your inputs</h1>
            <p>{error}</p>
            <button className="secondary-button" onClick={() => edit(1)}>
              Edit my week
            </button>
            <button className="text-button" onClick={onRetry}>
              Try calculation again
            </button>
          </div>
        )}
      </div>
      {best && result && (
        <>
          <header className="page-heading result-heading">
            <p>
              {hasWork
                ? "Recommended plan"
                : result.hasCoveredWork
                  ? "Keeping your time is the better option"
                  : "Your care plan needs a little more work"}
            </p>
            <h1>
              {hasWork
                ? titles(best, plan)
                : result.hasCoveredWork
                  ? "Skip the extra shifts this week."
                  : "No covered shift yet."}
            </h1>
          </header>
          <div className="result-summary">
            <p>Estimated additional money kept</p>
            <strong className="net-number" data-testid="net-gain">
              {money(best.netGainCents)}
            </strong>
            <p className="baseline">Compared with taking no extra shifts</p>
            {compared && hasWork && (
              <p className="decision-line">
                {compared.difference > 0 ? (
                  <>
                    <strong>{money(compared.difference)} more</strong> than{" "}
                    {titles(compared.alternative, plan)}.
                  </>
                ) : (
                  <>
                    Same money as {titles(compared.alternative, plan)}; we
                    prefer fewer shifts, then lower care costs when tied.
                  </>
                )}
              </p>
            )}
          </div>
          <div className="result-reason">
            {hasWork ? (
              <>
                <h2>Why this works for you</h2>
                <p>
                  {compared &&
                  best.grossCents < compared.alternative.grossCents &&
                  best.addedCareCents === 0 &&
                  compared.alternative.addedCareCents > 0
                    ? "This plan pays less before costs, but you don’t need paid childcare."
                    : best.selectedShiftIds.length > 1
                      ? "Taking these shifts together leaves you the most money within your work limits."
                      : best.addedCareCents === 0
                        ? "Your entered care covers this shift without added childcare costs."
                        : "After childcare, travel and estimated withholding, this plan leaves you the most money."}
                </p>
                <p className="coverage-status">
                  <span aria-hidden="true">✓</span> Work and commute are covered
                  by your entered care.
                </p>
              </>
            ) : (
              <p>
                {result.hasCoveredWork
                  ? "None of the covered options leaves you with a positive gain under these assumptions."
                  : plan.offers.length
                    ? "We can’t recommend an extra shift until its care and work limits are covered. See what needs to change below."
                    : "Add a shift to start comparing your options."}
              </p>
            )}
          </div>
          <details className="section-disclosure">
            <summary>
              Where the money goes{" "}
              <span>{money(best.grossCents)} before costs</span>
            </summary>
            <CostBreakdown p={best} plan={plan} />
          </details>
          <section className="comparison-section">
            <div className="row-between">
              <h2>Compare your options</h2>
              <button className="text-button" onClick={() => edit(1)}>
                Edit shifts
              </button>
            </div>
            <p className="hint">
              Up to {plan.maxAdditionalShifts} extra{" "}
              {plan.maxAdditionalShifts === 1 ? "shift" : "shifts"}
              {plan.maxAdditionalWorkMinutes !== null
                ? ` · ${plan.maxAdditionalWorkMinutes / 60} work-hour limit`
                : ""}
              . Only covered plans are ranked.
            </p>
            <div className="comparison-list">
              {[best, ...result.alternatives].map((p, i) => (
                <div
                  className={`comparison-row ${i === 0 ? "chosen" : ""}`}
                  key={p.selectedShiftIds.join("|")}
                >
                  <div>
                    <strong>{titles(p, plan)}</strong>
                    <small>
                      {i === 0
                        ? "Recommended"
                        : `Childcare ${money(p.addedCareCents)} · travel ${money(p.travelCents)}`}
                    </small>
                  </div>
                  <strong>{money(p.netGainCents)}</strong>
                </div>
              ))}
            </div>
          </section>
          {result.individual.some((p) => !p.feasible) && (
            <section className="missing-care">
              <h2>What needs to change?</h2>
              {result.individual
                .filter((p) => !p.feasible)
                .map((p) => (
                  <article key={p.selectedShiftIds.join("|")}>
                    <h3>{titles(p, plan)}</h3>
                    {p.reasonCodes.map((code) => (
                      <p key={code}>{reasons[code]}</p>
                    ))}
                    {p.uncoveredCare.map((r, i) => (
                      <p key={i}>
                        <strong>Care missing:</strong> {rangeLabel(r)}
                      </p>
                    ))}
                  </article>
                ))}
              <button className="secondary-button" onClick={() => edit(2)}>
                Update childcare
              </button>
            </section>
          )}
          <details className="section-disclosure">
            <summary>
              Care for the recommended plan{" "}
              <span>{hasWork ? "Review hours" : "No shifts selected"}</span>
            </summary>
            <p className="hint">
              Based on the hours you entered. Confirm directly; nothing has been
              booked.
            </p>
            {best.coverage.map((c, i) => (
              <p className="care-line" key={i}>
                <strong>{c.source}</strong>
                <span>{rangeLabel(c)}</span>
              </p>
            ))}
            {best.plannedPaidCareVisits.length > 0 && (
              <>
                <h3>Full paid visits to arrange</h3>
                <p className="hint">
                  You pay for these entire visits, including minimum bookings
                  and any gaps between care needs.
                </p>
                {best.plannedPaidCareVisits.map((v, i) => (
                  <p key={i}>{rangeLabel(v)}</p>
                ))}
              </>
            )}
          </details>
          <details className="section-disclosure">
            <summary>Assumptions behind this estimate</summary>
            <ul>
              {result.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p className="hint">
              Up to 10 offers, one sitter, 15-minute intervals. This estimate
              does not assess care suitability or guarantee availability.
            </p>
          </details>
        </>
      )}
      <details className="section-disclosure">
        <summary>What if my plans change?</summary>
        <p className="hint">
          Try a different work limit. Your recommendation updates automatically.
        </p>
        <Limits plan={plan} change={change} issues={validate(plan)} />
        <div className="actions">
          <button className="text-button" onClick={() => edit(2)}>
            Change care availability
          </button>
          <button className="text-button" onClick={() => edit(3)}>
            Change costs
          </button>
        </div>
      </details>
    </section>
  );
}
