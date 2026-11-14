import { useEffect, useRef, useState } from "react";
import { demoWeek, blankWeek } from "./data/demoWeek";
import type { OptimizeResult, PlanInput, Issue } from "./domain/types";
import { validate } from "./domain/validation";
import { shiftDate } from "./domain/time";
import {
  deserializeWeek,
  nextWeekSettings,
  serializeWeek,
  STORAGE_KEY,
} from "./domain/persistence";
import FamilyCareForm from "./components/FamilyCareForm";
import ShiftOffersForm from "./components/ShiftOffersForm";
import CostsForm from "./components/CostsForm";
import ResultsPanel from "./components/ResultsPanel";
import { changedCareNeeds } from "./ui/planAdapter";
import WeekSettings from "./components/WeekSettings";
const steps = ["Your shifts", "Childcare", "Your costs", "Your result"];
function issueStep(i: Issue) {
  if (
    i.path === "withholdingPercent" ||
    i.path.endsWith("travelCostCents") ||
    i.path === "paidCare.hourlyCostCents"
  )
    return 3;
  if (
    i.path.startsWith("partner") ||
    i.path.startsWith("unpaid") ||
    i.path.startsWith("existing") ||
    i.path.startsWith("paidCare") ||
    i.path === "household"
  )
    return 2;
  return 1;
}
function newWeek() {
  const p = blankWeek();
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return {
    ...p,
    weekStart: shiftDate(date, (8 - now.getDay()) % 7),
    maxAdditionalShifts: 1,
  };
}
export default function App() {
  const [plan, setPlan] = useState<PlanInput>(demoWeek),
    [step, setStep] = useState(0),
    [furthest, setFurthest] = useState(1),
    [advanced, setAdvanced] = useState(false),
    [sample, setSample] = useState(false),
    [hasPlan, setHasPlan] = useState(false),
    [formKey, setFormKey] = useState(0),
    [revision, setRevision] = useState(0);
  const [calculation, setCalculation] = useState<{
    input: PlanInput;
    result?: OptimizeResult;
    error?: string;
  } | null>(null);
  const [note, setNote] = useState(""),
    [navigationError, setNavigationError] = useState("");
  const [careReview, setCareReview] = useState<string[]>([]);
  const main = useRef<HTMLElement>(null);
  const issues = validate(plan),
    valid = issues.length === 0;
  const result =
    calculation?.input === plan ? (calculation.result ?? null) : null;
  const error = !valid
    ? "Some inputs need attention before we can compare your options."
    : calculation?.input === plan
      ? (calculation.error ?? "")
      : "";
  const pending = step === 4 && valid && !result && !error;
  useEffect(() => {
    if (step !== 4 || !valid) return;
    const worker = new Worker(
      new URL("./domain/optimizer.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = (
      e: MessageEvent<{ result?: OptimizeResult; error?: string }>,
    ) => setCalculation({ input: plan, ...e.data });
    worker.onerror = () =>
      setCalculation({
        input: plan,
        error:
          "The calculation could not finish. Try again or reload the page.",
      });
    const timer = setTimeout(() => worker.postMessage(plan), 120);
    return () => {
      clearTimeout(timer);
      worker.terminate();
    };
  }, [plan, step, valid, revision]);
  useEffect(() => {
    if (step === 0) return;
    const heading = main.current?.querySelector<HTMLElement>(
      '[data-active="true"] h1',
    );
    heading?.setAttribute("tabindex", "-1");
    heading?.focus();
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step, formKey]);
  function navigate(next: number) {
    setNavigationError("");
    if (next > step) {
      const check = issues.filter((i) => next === 4 || issueStep(i) === step);
      if (step === 1 && !plan.offers.length) {
        setNavigationError("Add at least one shift to compare.");
        return;
      }
      if (check.length) {
        const target = issueStep(check[0]);
        setStep(target);
        setNavigationError(
          "Please check the highlighted fields before continuing.",
        );
        requestAnimationFrame(() =>
          main.current
            ?.querySelector<HTMLElement>(
              '[data-active="true"] [aria-invalid="true"]',
            )
            ?.focus(),
        );
        return;
      }
    }
    setFurthest((n) => Math.max(n, next));
    setStep(next);
  }
  function replace(p: PlanInput, message = "") {
    setPlan(p);
    setCalculation(null);
    setCareReview([]);
    setFormKey((k) => k + 1);
    setNote(message);
    setNavigationError("");
  }
  function start(isSample: boolean) {
    replace(isSample ? demoWeek() : newWeek());
    setSample(isSample);
    setHasPlan(true);
    setAdvanced(false);
    setFurthest(isSample ? 4 : 1);
    setStep(isSample ? 4 : 1);
  }
  function change(p: PlanInput) {
    const changed = changedCareNeeds(plan, p);
    setCareReview((old) =>
      [...new Set([...old, ...changed])].filter((id) =>
        p.offers.some((s) => s.id === id),
      ),
    );
    setPlan(p);
    setNavigationError("");
    setNote("");
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, serializeWeek(plan, sample));
      setNote(
        "Week saved on this browser. Saving again replaces your previous saved week.",
      );
    } catch {
      setNote(
        "Could not save. Check your inputs and whether this browser allows local storage.",
      );
    }
  }
  function restore() {
    try {
      const text = localStorage.getItem(STORAGE_KEY);
      if (!text) {
        setNote("No saved week in this browser yet.");
        return;
      }
      const saved = deserializeWeek(text);
      replace(
        saved.plan,
        "Saved week loaded. Recheck care availability before accepting shifts.",
      );
      setSample(saved.illustrative);
      setHasPlan(true);
      setFurthest(4);
      setStep(saved.plan.offers.length ? 4 : 1);
    } catch {
      setNote(
        "Could not load this saved week. Your current inputs are unchanged.",
      );
    }
  }
  function reuse() {
    try {
      replace(
        nextWeekSettings(plan),
        "Care hours copied to next week; shift offers cleared. Reconfirm every copied care window before accepting work.",
      );
      setStep(1);
      setFurthest(1);
    } catch {
      setNote(
        "Could not plan next week. Fix input errors first; the next week must have no daylight saving clock change.",
      );
    }
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <button
          className="brand"
          onClick={() => {
            setStep(0);
            setNote("");
          }}
          aria-label="ShiftMargin home"
        >
          <span className="brand-symbol" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          ShiftMargin<span className="brand-period">.</span>
        </button>
        <span className="header-note">A clearer choice for your family.</span>
        {step > 0 && (
          <button
            className="text-button"
            onClick={() => setAdvanced(!advanced)}
          >
            {advanced ? "Quick Compare" : "Advanced Planning"}
          </button>
        )}
      </header>
      <main
        id="main"
        ref={main}
        tabIndex={-1}
        className={
          step === 0
            ? "entry"
            : `workspace ${step === 4 ? "result-workspace" : ""}`
        }
      >
        <section className="entry-content" hidden={step !== 0}>
          <span className="entry-intro">
            A little clarity before you say yes.
          </span>
          <div className="entry-main">
            <h1>
              Find the shift that
              <br />
              <em>leaves you more.</em>
            </h1>
            <p className="entry-description">
              Compare extra shifts after childcare and travel costs.
            </p>
            <div className="entry-actions">
              <button className="primary-button" onClick={() => start(false)}>
                Compare my shifts <span aria-hidden="true">→</span>
              </button>
              <button className="secondary-button" onClick={() => start(true)}>
                Try an example
              </button>
            </div>
            <p className="privacy-line">
              No sign-up required <span>·</span> Private calculation{" "}
              <span>·</span> Estimated results
            </p>
          </div>
          <div className="entry-how">
            <p>
              <span className="how-number" aria-hidden="true">
                01
              </span>
              <strong>Add your shifts</strong>
              <span>The hours and pay you’re considering.</span>
            </p>
            <p>
              <span className="how-number" aria-hidden="true">
                02
              </span>
              <strong>Confirm care</strong>
              <span>Who’s available while you work.</span>
            </p>
            <p>
              <span className="how-number" aria-hidden="true">
                03
              </span>
              <strong>See what stays</strong>
              <span>The money left after added costs.</span>
            </p>
          </div>
          <button className="text-button" onClick={restore}>
            Load a saved week
          </button>
          {hasPlan && (
            <button className="text-button" onClick={() => setStep(furthest)}>
              Continue my current plan
            </button>
          )}
          {note && (
            <p role="status" className="notice">
              {note}
            </p>
          )}
        </section>
        <div hidden={step === 0}>
          <nav aria-label="Comparison steps" className="progress">
            <ol>
              {steps.map((title, i) => (
                <li key={title}>
                  <button
                    aria-label={`${i + 1} ${title}`}
                    aria-current={step === i + 1 ? "step" : undefined}
                    disabled={i + 1 > furthest}
                    onClick={() => navigate(i + 1)}
                  >
                    <span className="step-number">{i + 1}</span>
                    <span>{title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <div className="workspace-meta">
            <span>{advanced ? "Advanced Planning" : "Quick Compare"}</span>
            {sample && (
              <span>
                Illustrative example{" "}
                <button className="text-button" onClick={() => start(true)}>
                  Reset
                </button>
              </span>
            )}
          </div>
          {sample && (
            <p className="sample-note">
              Fictional shifts, real calculation. Edit any input to see what
              changes.
            </p>
          )}
          {note && (
            <p className="notice" role="status">
              {note}
            </p>
          )}
          {navigationError && (
            <p className="error-summary" role="alert">
              {navigationError}
            </p>
          )}
          {careReview.length > 0 && (
            <aside className="notice care-review" role="status">
              <strong>Work hours changed. Recheck childcare.</strong>
              <p>
                {plan.offers
                  .filter((s) => careReview.includes(s.id))
                  .map((s) => s.title)
                  .join(", ")}
                : saved care hours have not changed. Check they cover the new
                work and commute times.
              </p>
              {step === 2 ? (
                <button
                  className="text-button"
                  onClick={() => setCareReview([])}
                >
                  I’ve reviewed the care hours
                </button>
              ) : (
                <button className="text-button" onClick={() => setStep(2)}>
                  Review childcare
                </button>
              )}
            </aside>
          )}
          <div key={formKey}>
            <div hidden={step !== 1} data-active={step === 1}>
              <WeekSettings
                issues={issues}
                plan={plan}
                replace={replace}
                advanced={advanced}
              />
              <ShiftOffersForm
                plan={plan}
                change={change}
                issues={issues}
                advanced={advanced}
              />
            </div>
            <div hidden={step !== 2} data-active={step === 2}>
              <FamilyCareForm
                plan={plan}
                change={change}
                issues={issues}
                advanced={advanced}
              />
            </div>
            <div hidden={step !== 3} data-active={step === 3}>
              <CostsForm plan={plan} change={change} issues={issues} />
            </div>
            <div hidden={step !== 4} data-active={step === 4}>
              <ResultsPanel
                careNeedsReview={careReview.length > 0}
                result={result}
                plan={plan}
                pending={pending}
                error={error}
                onRetry={() => {
                  setCalculation(null);
                  setRevision((n) => n + 1);
                }}
                edit={(n) => {
                  setStep(n);
                  setNavigationError("");
                }}
                change={change}
              />
            </div>
          </div>
          <div className="step-actions">
            {step < 4 ? (
              <>
                <button
                  className="text-button"
                  onClick={() => navigate(step - 1)}
                >
                  ← {step === 1 ? "Home" : "Back"}
                </button>
                <button
                  className="primary-button"
                  onClick={() => navigate(step + 1)}
                >
                  {step === 3
                    ? "Compare my options"
                    : step === 2
                      ? "Continue to costs"
                      : "Continue to childcare"}{" "}
                  <span aria-hidden="true">→</span>
                </button>
              </>
            ) : (
              <>
                <button className="secondary-button" onClick={() => setStep(1)}>
                  Edit my week
                </button>
                <button className="primary-button" onClick={save}>
                  Save this week
                </button>
              </>
            )}
          </div>
          {step === 4 && (
            <button className="next-week-button" onClick={reuse}>
              Plan next week <span aria-hidden="true">→</span>
              <small>Copy care settings and add new shifts</small>
            </button>
          )}
          <details className="saved-tools">
            <summary>Saved week & privacy</summary>
            <p className="hint">
              Save one week on this browser only. Nothing is saved automatically
              or sent to a server. Reloading closes an unsaved plan. No cloud
              sync.
            </p>
            <div className="actions">
              <button className="text-button" onClick={restore}>
                Load saved week
              </button>
              <button
                className="text-button"
                onClick={() => {
                  try {
                    localStorage.removeItem(STORAGE_KEY);
                    setNote(
                      "Saved week removed from this browser. Your current inputs are unchanged.",
                    );
                  } catch {
                    setNote("Could not access local storage.");
                  }
                }}
              >
                Remove saved week
              </button>
            </div>
          </details>
        </div>
      </main>
      <footer>
        <span>ShiftMargin · Earn more. Keep more.</span>
        <span>Estimates, not guarantees. Confirm care directly.</span>
      </footer>
    </>
  );
}
