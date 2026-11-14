import { useEffect, useState } from "react";
import type { OptimizeResult } from "../domain/types";
import type { SavedPlan } from "../storage/planLibrary";
import { money } from "../domain/money";
import { shiftDate } from "../domain/time";
import { dateLabel } from "../ui/planAdapter";
import { CostBreakdown, titles } from "./ResultsPanel";
export default function SavedPlanComparison({
  plans,
}: {
  plans: [SavedPlan, SavedPlan];
}) {
  const [state, setState] = useState<{
    inputs: typeof plans;
    results?: [OptimizeResult, OptimizeResult];
    error?: string;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const workers: Worker[] = [];
    const results: OptimizeResult[] = [];
    const fail = () => {
      if (!cancelled) {
        setState({
          inputs: plans,
          error:
            "Could not compare these plans. Try again; your saved inputs are unchanged.",
        });
        cancelled = true;
        workers.forEach((w) => w.terminate());
      }
    };
    try {
      plans.forEach((saved, index) => {
        const worker = new Worker(
          new URL("../domain/optimizer.worker.ts", import.meta.url),
          { type: "module" },
        );
        workers.push(worker);
        worker.onerror = fail;
        worker.onmessage = (
          e: MessageEvent<{ result?: OptimizeResult; error?: string }>,
        ) => {
          if (cancelled) return;
          if (!e.data.result || e.data.error) {
            fail();
            return;
          }
          results[index] = e.data.result;
          if (results[0] && results[1])
            setState({ inputs: plans, results: [results[0], results[1]] });
        };
        worker.postMessage(saved.plan);
      });
    } catch {
      fail();
    }
    return () => {
      cancelled = true;
      workers.forEach((w) => w.terminate());
    };
  }, [plans, retry]);
  const current = state?.inputs === plans ? state : null;
  const results = current?.results;
  const difference = results
    ? results[1].best.netGainCents - results[0].best.netGainCents
    : 0;
  return (
    <section aria-label="Saved plan comparison">
      <p className="hint">
        Recalculated from your saved inputs. These are estimates, not recorded
        earnings or realized savings.
      </p>
      {plans[0].plan.weekStart !== plans[1].plan.weekStart && (
        <p className="notice">
          Different weeks: these are separate scenarios, not a like-for-like
          measure of savings.
        </p>
      )}
      <div role="status" aria-live="polite">
        {!current && <p className="notice">Recalculating both plans…</p>}
        {current?.error && <p className="error">{current.error}</p>}
        {results && (
          <p className="comparison-difference">
            {difference === 0 ? (
              "Both plans estimate the same money kept."
            ) : (
              <>
                <strong>
                  {money(Math.abs(difference))}{" "}
                  {difference > 0 ? "more" : "less"}
                </strong>{" "}
                estimated money kept in “{plans[1].name}” than “{plans[0].name}
                ”.
              </>
            )}
          </p>
        )}
      </div>
      {current?.error && (
        <button
          className="secondary-button"
          onClick={() => {
            setState(null);
            setRetry((n) => n + 1);
          }}
        >
          Retry comparison
        </button>
      )}
      {results && (
        <div className="saved-comparison-grid">
          {plans.map((saved, i) => (
            <article className="saved-comparison" key={saved.id}>
              <h3>{saved.name}</h3>
              <p className="hint">
                {dateLabel(saved.plan.weekStart)}–
                {dateLabel(shiftDate(saved.plan.weekStart, 6))} ·{" "}
                {saved.plan.weekStart.slice(0, 4)} ·{" "}
                {saved.plan.timeZone.replaceAll("_", " ")}
              </p>
              {saved.illustrative && (
                <p className="sample-note">Illustrative example</p>
              )}
              <p className="saved-choice">
                {titles(results[i].best, saved.plan)}
              </p>
              <CostBreakdown p={results[i].best} plan={saved.plan} />
              <p className="hint">
                Up to {saved.plan.maxAdditionalShifts} extra{" "}
                {saved.plan.maxAdditionalShifts === 1 ? "shift" : "shifts"}
                {saved.plan.maxAdditionalWorkMinutes !== null
                  ? ` · ${saved.plan.maxAdditionalWorkMinutes / 60} work-hour limit`
                  : ""}
                . Based on this plan’s own pay, care availability and costs.
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
