import type { PlanInput } from "../domain/types";
import { assertPlan } from "../domain/validation";
export const LIBRARY_KEY = "shiftmargin.plus-library.v1";
export const DEMO_KEY = "shiftmargin.plus-demo.v1";
export const MAX_PLANS = 5;
export const MAX_LIBRARY_CHARS = 500_000;
export const MAX_PLAN_CHARS = 100_000;
export type SavedPlan = {
  id: string;
  name: string;
  plan: PlanInput;
  illustrative: boolean;
  savedAt: string;
};
export type StorageAccess = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function planName(value: string) {
  const name = value.trim();
  if (!name || name.length > 60 || /[\u0000-\u001f\u007f]/.test(name))
    throw new Error("Use a plan name with 1–60 characters.");
  return name;
}
function savedPlan(value: unknown): SavedPlan {
  if (
    !record(value) ||
    typeof value.id !== "string" ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(value.id) ||
    typeof value.name !== "string" ||
    typeof value.illustrative !== "boolean" ||
    typeof value.savedAt !== "string" ||
    !/^\d{4}-\d\d-\d\dT/.test(value.savedAt) ||
    value.savedAt.length > 30 ||
    !Number.isFinite(Date.parse(value.savedAt))
  )
    throw new Error("A saved plan has an unsupported format.");
  assertPlan(value.plan);
  const item = {
    id: value.id,
    name: planName(value.name),
    plan: value.plan,
    illustrative: value.illustrative,
    savedAt: value.savedAt,
  };
  if (JSON.stringify(item).length > MAX_PLAN_CHARS)
    throw new Error("This plan is too large to save.");
  return item;
}
export function parseLibrary(text: string | null): SavedPlan[] {
  if (text === null) return [];
  if (text.length > MAX_LIBRARY_CHARS)
    throw new Error("This plan library is too large.");
  const data: unknown = JSON.parse(text);
  if (
    !record(data) ||
    data.libraryVersion !== 1 ||
    !Array.isArray(data.plans) ||
    data.plans.length > MAX_PLANS
  )
    throw new Error("This plan library uses an unsupported format.");
  const plans = data.plans.map(savedPlan);
  if (new Set(plans.map((p) => p.id)).size !== plans.length)
    throw new Error("Saved plan IDs must be unique.");
  return plans;
}
export function serializeLibrary(plans: SavedPlan[]) {
  const text = JSON.stringify({ libraryVersion: 1, plans });
  parseLibrary(text); // Validate on write as well as read, before touching storage.
  return text;
}
export function makeSavedPlan(
  plan: unknown,
  illustrative: boolean,
  name: string,
): SavedPlan {
  const item = savedPlan({
    id: crypto.randomUUID(),
    plan,
    illustrative,
    name,
    savedAt: new Date().toISOString(),
  });
  return JSON.parse(JSON.stringify(item)) as SavedPlan; // Immutable input snapshot, never a stored result.
}
export function writeLibrary(
  storage: StorageAccess,
  plans: SavedPlan[],
  expected: string | null,
) {
  const text = serializeLibrary(plans);
  if (storage.getItem(LIBRARY_KEY) !== expected)
    throw new Error(
      "Saved plans changed in another tab. Refresh the library before trying again.",
    );
  storage.setItem(LIBRARY_KEY, text); // An unsuccessful write must not update UI state.
  return text;
}
export function clearLibrary(storage: StorageAccess, expected: string | null) {
  if (storage.getItem(LIBRARY_KEY) !== expected)
    throw new Error(
      "Saved plans changed in another tab. Refresh the library before clearing it.",
    );
  storage.removeItem(LIBRARY_KEY);
}
export function demoIsActive(storage: StorageAccess): boolean {
  const text = storage.getItem(DEMO_KEY);
  if (text === null) return false;
  if (text.length > 100) return false;
  try {
    const value: unknown = JSON.parse(text);
    return record(value) && value.demoVersion === 1 && value.active === true;
  } catch {
    return false;
  }
}
export function setDemo(storage: StorageAccess, active: boolean) {
  if (active)
    storage.setItem(DEMO_KEY, JSON.stringify({ demoVersion: 1, active: true }));
  else storage.removeItem(DEMO_KEY);
}
