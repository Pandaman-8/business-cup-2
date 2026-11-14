import { useEffect, useMemo, useState } from "react";
import type { PlanInput } from "../domain/types";
import { deserializeWeek, STORAGE_KEY } from "../domain/persistence";
import type { SavedWeek } from "../domain/persistence";
import { validate } from "../domain/validation";
import { dateLabel } from "../ui/planAdapter";
import {
  LIBRARY_KEY,
  DEMO_KEY,
  MAX_PLANS,
  parseLibrary,
  makeSavedPlan,
  writeLibrary,
  clearLibrary,
  demoIsActive,
  setDemo,
  planName,
} from "../storage/planLibrary";
import type { SavedPlan } from "../storage/planLibrary";
import Modal from "./Modal";
import { Field } from "./Fields";
import SavedPlanComparison from "./SavedPlanComparison";
export type PlanAction = "library" | "pricing" | "save-extra" | "replace-free";
type Page =
  | "pricing"
  | "library"
  | "save"
  | "replace-free"
  | "rename"
  | "delete"
  | "clear"
  | "compare";
function snapshot() {
  let raw: string | null = null,
    plans: SavedPlan[] = [],
    error = "";
  let freeRaw: string | null = null,
    free: SavedWeek | null = null,
    freeError = "";
  try {
    raw = localStorage.getItem(LIBRARY_KEY);
    plans = parseLibrary(raw);
  } catch {
    error =
      "Could not read the Plus library. Your data has not been changed. Refresh the library, or clear it only if you no longer need the stored plans.";
  }
  try {
    freeRaw = localStorage.getItem(STORAGE_KEY);
    if (freeRaw !== null) free = deserializeWeek(freeRaw);
  } catch {
    freeError = "Could not read the Free saved week. It has not been changed.";
  }
  return { raw, plans, error, freeRaw, free, freeError };
}
function activeDemo() {
  try {
    return demoIsActive(localStorage);
  } catch {
    return false;
  }
}
function message(error: unknown) {
  return error instanceof Error && !(error instanceof DOMException)
    ? error.message
    : "Could not save this change. Browser storage may be full or unavailable. Your saved plans are unchanged.";
}
export default function PlanManager({
  action,
  plan,
  illustrative,
  hasPlan,
  onClose,
  onDemoChange,
  onRestore,
  onReplaceFree,
}: {
  action: PlanAction;
  plan: PlanInput;
  illustrative: boolean;
  hasPlan: boolean;
  onClose: () => void;
  onDemoChange: (active: boolean) => void;
  onRestore: (saved: SavedPlan) => void;
  onReplaceFree: (expected: string | null) => void;
}) {
  const [active, setActive] = useState(activeDemo);
  const [store, setStore] = useState(snapshot);
  const [page, setPage] = useState<Page>(() =>
    action === "replace-free"
      ? "replace-free"
      : action === "pricing" || !active
        ? "pricing"
        : action === "save-extra"
          ? "save"
          : "library",
  );
  const [intent, setIntent] = useState<"save" | "library">(
    action === "save-extra" ? "save" : "library",
  );
  const [name, setName] = useState(`Week of ${dateLabel(plan.weekStart)}`);
  const [includeFree, setIncludeFree] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [target, setTarget] = useState<SavedPlan | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canSave = hasPlan && validate(plan).length === 0;
  const freeToCopy =
    store.free &&
    !store.plans.some(
      (p) =>
        JSON.stringify(p.plan) === JSON.stringify(store.free!.plan) &&
        p.illustrative === store.free!.illustrative,
    ) &&
    JSON.stringify(store.free.plan) !== JSON.stringify(plan)
      ? store.free
      : null;
  const pair = useMemo(
    () =>
      selected
        .map((id) => store.plans.find((p) => p.id === id))
        .filter((p): p is SavedPlan => !!p),
    [selected, store.plans],
  );
  function show(next: Page) {
    setError("");
    setNotice("");
    setPage(next);
  }
  function refresh() {
    setStore(snapshot());
    setSelected([]);
    setError("");
    setNotice("Library refreshed.");
  }
  function requireAccess() {
    if (!demoIsActive(localStorage)) {
      setActive(false);
      onDemoChange(false);
      setPage("pricing");
      setSelected([]);
      throw new Error(
        "Plus Demo is off. Unlock it again to use saved-plan features. Your plans are still stored.",
      );
    }
  }
  function requireCurrent() {
    requireAccess();
    if (store.error)
      throw new Error(
        "Refresh or clear the unreadable library before continuing.",
      );
    if (localStorage.getItem(LIBRARY_KEY) !== store.raw)
      throw new Error(
        "Saved plans changed in another tab. Refresh the library before continuing.",
      );
  }
  function checkFreeSnapshot() {
    if (localStorage.getItem(STORAGE_KEY) !== store.freeRaw)
      throw new Error(
        "The Free saved week changed in another tab. Refresh the library before copying it.",
      );
  }
  function update(plans: SavedPlan[]) {
    requireCurrent();
    const raw = writeLibrary(localStorage, plans, store.raw);
    setStore({ ...store, plans, raw });
  }
  function unlock() {
    try {
      setDemo(localStorage, true);
      setActive(true);
      onDemoChange(true);
      setStore(snapshot());
      show(intent);
    } catch (e) {
      setError(message(e));
    }
  }
  function disable() {
    try {
      setDemo(localStorage, false);
      setActive(false);
      onDemoChange(false);
      setSelected([]);
      setIntent("library");
      show("pricing");
      setNotice(
        "Plus Demo is off. Your library is kept in this browser; unlock again to access it. Free still works.",
      );
    } catch (e) {
      setError(message(e));
    }
  }
  function save() {
    try {
      if (!canSave)
        throw new Error("Correct your current plan’s inputs before saving it.");
      if (freeToCopy && includeFree) checkFreeSnapshot();
      const extra =
        freeToCopy && includeFree
          ? [
              makeSavedPlan(
                freeToCopy.plan,
                freeToCopy.illustrative,
                `Free week · ${dateLabel(freeToCopy.plan.weekStart)}`,
              ),
            ]
          : [];
      if (store.plans.length + extra.length + 1 > MAX_PLANS)
        throw new Error(
          "Your library holds up to five plans. Delete a plan first, or keep the Free week in its separate slot.",
        );
      update([
        ...store.plans,
        ...extra,
        makeSavedPlan(plan, illustrative, name),
      ]);
      setSelected([]);
      show("library");
      setNotice(
        "Plan saved in this browser. Your Free saved week is unchanged.",
      );
    } catch (e) {
      setError(message(e));
    }
  }
  useEffect(() => {
    function changed(e: StorageEvent) {
      if (e.key === DEMO_KEY || e.key === null) {
        const enabled = activeDemo();
        setActive(enabled);
        onDemoChange(enabled);
        if (!enabled) {
          setPage("pricing");
          setSelected([]);
        }
      }
      if (e.key === LIBRARY_KEY || e.key === STORAGE_KEY || e.key === null)
        setError(
          "Saved data changed in another tab. Refresh the library before continuing.",
        );
    }
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [onDemoChange]);
  const protectedPage = [
    "library",
    "save",
    "rename",
    "delete",
    "compare",
  ].includes(page);
  const displayPage = protectedPage && !active ? "pricing" : page;
  const title = {
    pricing: "A plan for this week. Room for what’s next.",
    library: "Your plan library",
    save: "Save another plan",
    "replace-free": "Keep your saved week?",
    rename: "Rename plan",
    delete: "Delete this plan?",
    clear: "Clear the Plus library?",
    compare: "Compare saved plans",
  }[displayPage];
  return (
    <Modal title={title} onClose={onClose}>
      {active && (
        <p className="demo-status">Plus demo active · No payment processed</p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="error-summary" role="alert">
          {error}
        </p>
      )}
      {displayPage === "pricing" && (
        <>
          <p className="dialog-intro">
            Compare this week for free. Keep your options across weeks with
            Plus.
          </p>
          <div className="pricing-grid">
            <section>
              <h3>Free</h3>
              <p className="price">$0</p>
              <ul>
                <li>Full weekly calculation and what-if changes</li>
                <li>Cost breakdown and shift comparison</li>
                <li>One saved week and next-week planning</li>
              </ul>
            </section>
            <section className="plus-price">
              <h3>ShiftMargin Plus</h3>
              <p className="price">
                $5.99<span>/month</span>
              </p>
              <ul>
                <li>Keep up to five named plans</li>
                <li>Reopen and manage your saved history</li>
                <li>Compare two plans with fresh calculations</li>
              </ul>
            </section>
          </div>
          <p className="hint">
            Proposed price for a future subscription. This is a functional
            monetization prototype, not a paid subscription.
          </p>
          <div className="dialog-actions">
            {active ? (
              <button
                className="primary-button"
                onClick={() => show("library")}
              >
                Open plan library
              </button>
            ) : (
              <button className="primary-button" onClick={unlock}>
                Try Plus Demo — No payment required
              </button>
            )}
            <button className="text-button" onClick={onClose}>
              {active ? "Close pricing" : "Continue with Free"}
            </button>
          </div>
          <p className="hint">
            No card details. No payment. Demo access is stored locally and can
            be turned off.
          </p>
          <details className="section-disclosure">
            <summary>Stored plans & privacy</summary>
            <p className="hint">
              Turning off Demo keeps your plans. Clear the Plus library only if
              you want to delete them.
            </p>
            <button className="text-button" onClick={() => show("clear")}>
              Clear Plus library
            </button>
          </details>
        </>
      )}
      {displayPage === "replace-free" && (
        <>
          <p className="dialog-intro">
            Free keeps one saved week. Replacing it will remove the previous
            saved version.
          </p>
          {store.free && (
            <p className="notice">
              Currently saved: week of {dateLabel(store.free.plan.weekStart)} ·{" "}
              {store.free.plan.weekStart.slice(0, 4)}
              {store.free.illustrative ? " · illustrative example" : ""}.
            </p>
          )}
          {store.freeError && (
            <p className="notice">
              {store.freeError} Replacing it will discard the unreadable saved
              data.
            </p>
          )}
          <div className="dialog-actions">
            <button
              className="primary-button"
              onClick={() => {
                setIntent("save");
                show(active ? "save" : "pricing");
              }}
            >
              Keep both with Plus
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                try {
                  onReplaceFree(store.freeRaw);
                  onClose();
                } catch (e) {
                  setError(message(e));
                }
              }}
            >
              Replace Free saved week
            </button>
            <button className="text-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </>
      )}
      {displayPage === "save" && (
        <>
          <p className="dialog-intro">
            Keep this scenario without replacing your Free saved week.
          </p>
          {store.error ? (
            <p className="error-summary" role="alert">
              {store.error}
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <Field
                label="Plan name"
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {freeToCopy && (
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={includeFree}
                    onChange={(e) => setIncludeFree(e.target.checked)}
                  />
                  <span>
                    Also copy my Free saved week to the library
                    <small>
                      It stays in the Free slot too. You can compare both plans
                      right away.
                    </small>
                  </span>
                </label>
              )}
              {store.freeError && (
                <p className="notice">
                  {store.freeError} This save will only add the current plan.
                </p>
              )}
              {!canSave && (
                <p className="notice">
                  Finish correcting your current plan before saving it.
                </p>
              )}
              <div className="dialog-actions">
                <button
                  className="primary-button"
                  disabled={!canSave}
                  type="submit"
                >
                  Save to library
                </button>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => show("library")}
                >
                  Back to library
                </button>
              </div>
            </form>
          )}
          {store.error && (
            <button
              className="secondary-button"
              onClick={() => show("library")}
            >
              Review library
            </button>
          )}
        </>
      )}
      {displayPage === "library" && (
        <>
          <p className="dialog-intro">
            Keep a few options. Return when your shifts or care change.
          </p>
          <p className="hint">
            Opening a plan replaces your current inputs. Save your current plan
            first if you want to keep it.
          </p>
          {store.error ? (
            <p className="error-summary" role="alert">
              {store.error}
            </p>
          ) : (
            <>
              <p className="library-count">
                {store.plans.length} of {MAX_PLANS} plans saved · Select two to
                compare
              </p>
              {!store.plans.length && (
                <p className="notice">
                  No plans here yet. Save your current plan, or copy your Free
                  saved week.
                </p>
              )}
              <div className="library-list">
                {store.plans.map((p) => (
                  <article className="library-item" key={p.id}>
                    <label className="check-row">
                      <input
                        type="checkbox"
                        aria-label={`Compare ${p.name}`}
                        checked={selected.includes(p.id)}
                        disabled={
                          !selected.includes(p.id) && selected.length === 2
                        }
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, p.id]
                              : selected.filter((id) => id !== p.id),
                          )
                        }
                      />
                      <span>
                        <strong>{p.name}</strong>
                        <small>
                          Week of {dateLabel(p.plan.weekStart)} ·{" "}
                          {p.plan.weekStart.slice(0, 4)}
                          {p.illustrative ? " · example" : ""}
                        </small>
                        <small>
                          Saved{" "}
                          {new Date(p.savedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </small>
                      </span>
                    </label>
                    <div className="actions">
                      <button
                        className="text-button"
                        aria-label={`Open ${p.name}`}
                        onClick={() => {
                          try {
                            requireCurrent();
                            onRestore(p);
                            onClose();
                          } catch (e) {
                            setError(message(e));
                          }
                        }}
                      >
                        Open
                      </button>
                      <button
                        className="text-button"
                        aria-label={`Rename ${p.name}`}
                        onClick={() => {
                          setTarget(p);
                          setName(p.name);
                          show("rename");
                        }}
                      >
                        Rename
                      </button>
                      <button
                        className="text-button"
                        aria-label={`Delete ${p.name}`}
                        onClick={() => {
                          setTarget(p);
                          show("delete");
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="dialog-actions">
                <button
                  className="primary-button"
                  disabled={selected.length !== 2}
                  onClick={() => {
                    try {
                      requireCurrent();
                      show("compare");
                    } catch (e) {
                      setError(message(e));
                    }
                  }}
                >
                  Compare selected plans
                </button>
                {hasPlan && (
                  <button
                    className="secondary-button"
                    disabled={store.plans.length >= MAX_PLANS}
                    onClick={() => {
                      setName(`Week of ${dateLabel(plan.weekStart)}`);
                      show("save");
                    }}
                  >
                    Save current plan
                  </button>
                )}
              </div>
              {store.plans.length >= MAX_PLANS && (
                <p className="hint">
                  Library full. Delete a plan before adding another.
                </p>
              )}
              {store.free &&
                !store.plans.some(
                  (p) =>
                    JSON.stringify(p.plan) ===
                      JSON.stringify(store.free!.plan) &&
                    p.illustrative === store.free!.illustrative,
                ) && (
                  <button
                    className="text-button"
                    disabled={store.plans.length >= MAX_PLANS}
                    onClick={() => {
                      try {
                        checkFreeSnapshot();
                        update([
                          ...store.plans,
                          makeSavedPlan(
                            store.free!.plan,
                            store.free!.illustrative,
                            `Free week · ${dateLabel(store.free!.plan.weekStart)}`,
                          ),
                        ]);
                        setNotice(
                          "Free saved week copied. The original remains in its Free slot.",
                        );
                      } catch (e) {
                        setError(message(e));
                      }
                    }}
                  >
                    Copy Free saved week
                  </button>
                )}
              {store.freeError && <p className="hint">{store.freeError}</p>}
            </>
          )}
          <div className="library-tools">
            <button className="text-button" onClick={refresh}>
              Refresh library
            </button>
            <button className="text-button" onClick={() => show("clear")}>
              Clear Plus library
            </button>
            <button className="text-button" onClick={disable}>
              Turn off Plus Demo
            </button>
          </div>
        </>
      )}
      {displayPage === "rename" && target && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              update(
                store.plans.map((p) =>
                  p.id === target.id ? { ...p, name: planName(name) } : p,
                ),
              );
              show("library");
              setNotice("Plan renamed.");
            } catch (err) {
              setError(message(err));
            }
          }}
        >
          <Field
            label="Plan name"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="dialog-actions">
            <button className="primary-button" type="submit">
              Save name
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => show("library")}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {displayPage === "delete" && target && (
        <>
          <p>
            Delete “{target.name}” from this browser? This cannot be undone.
            Your current plan and Free saved week will stay.
          </p>
          <div className="dialog-actions">
            <button
              className="secondary-button"
              onClick={() => {
                try {
                  update(store.plans.filter((p) => p.id !== target.id));
                  setSelected(selected.filter((id) => id !== target.id));
                  show("library");
                  setNotice("Plan deleted.");
                } catch (e) {
                  setError(message(e));
                }
              }}
            >
              Delete saved plan
            </button>
            <button className="text-button" onClick={() => show("library")}>
              Cancel
            </button>
          </div>
        </>
      )}
      {displayPage === "clear" && (
        <>
          <p>
            Delete all Plus plans stored in this browser? This cannot be undone.
            Your Free saved week and current inputs will stay.
          </p>
          <div className="dialog-actions">
            <button
              className="secondary-button"
              onClick={() => {
                try {
                  clearLibrary(localStorage, store.raw);
                  setStore(snapshot());
                  setSelected([]);
                  show(active ? "library" : "pricing");
                  setNotice(
                    "Plus library cleared. Your Free saved week is unchanged.",
                  );
                } catch (e) {
                  setError(message(e));
                }
              }}
            >
              Delete all Plus plans
            </button>
            <button
              className="text-button"
              onClick={() => show(active ? "library" : "pricing")}
            >
              Cancel
            </button>
          </div>
        </>
      )}
      {displayPage === "compare" && pair.length === 2 && (
        <>
          <SavedPlanComparison plans={pair as [SavedPlan, SavedPlan]} />
          <button className="text-button" onClick={() => show("library")}>
            Back to library
          </button>
        </>
      )}
      <p className="storage-note">
        Plans are stored in this browser only. No account or cloud sync. Nothing
        is sent to a server.
      </p>
    </Modal>
  );
}
