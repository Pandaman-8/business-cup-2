import type { TimeRange } from './types';
export const SLOTS = 7 * 24 * 4;
export const ZONES = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'America/Phoenix', 'Pacific/Honolulu'] as const;
// UTC is a calendar coordinate here, NOT a conversion of the user's local times.
export function localMillis(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return NaN;
  const n = Date.parse(value + ':00Z');
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 16) === value ? n : NaN;
}
export function slot(value: string, week: string): number { return (localMillis(value) - localMillis(week + 'T00:00')) / 900000; }
export function atSlot(value: number, week: string): string { return new Date(localMillis(week + 'T00:00') + value * 900000).toISOString().slice(0, 16); }
export function shiftDate(value: string, days: number): string { return new Date(localMillis(value.slice(0, 10) + 'T00:00') + days * 86400000).toISOString().slice(0, 10); }
export function hasDstTransition(week: string, zone: string): boolean {
  const format = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' });
  const offsets = new Set<string>();
  // All supported US zones change on Sunday. Sampling noon UTC each day
  // through next Monday includes both sides without using the device zone.
  for (let day = 0; day <= 7; day++) offsets.add(format.formatToParts(new Date(localMillis(week + 'T12:00') + day * 86400000)).find(p => p.type === 'timeZoneName')!.value);
  return offsets.size > 1;
}
export function mask(ranges: TimeRange[], week: string): boolean[] {
  const out = Array<boolean>(SLOTS).fill(false);
  for (const r of ranges) for (let t = slot(r.start, week); t < slot(r.end, week); t++) out[t] = true;
  return out;
}
export function rangesFromMask(values: boolean[], week: string): TimeRange[] {
  const result: TimeRange[] = [];
  for (let t = 0; t < values.length;) {
    if (!values[t]) { t++; continue; }
    const start = t;
    while (t < values.length && values[t]) t++;
    result.push({ start: atSlot(start, week), end: atSlot(t, week) });
  }
  return result;
}
export function rangeLabel(r: TimeRange): string {
  const fmt = (value: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(localMillis(value)));
  return `${fmt(r.start)} – ${fmt(r.end)}`;
}
