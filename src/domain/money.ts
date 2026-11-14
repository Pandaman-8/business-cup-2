export const MAX_CENTS = 1_000_000;
export function parseMoney(text: string): number {
  if (!/^\d{1,5}(\.\d{0,2})?$/.test(text)) return NaN;
  const [whole, fraction = ''] = text.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
export function roundRatio(numerator: number, denominator: number): number {
  return Math.floor((numerator + denominator / 2) / denominator);
}
export function payForMinutes(rate: number, minutes: number): number { return roundRatio(rate * minutes, 60); }
export function withheld(gross: number, percent: number): number { return roundRatio(gross * Math.round(percent * 100), 10000); }
export function money(cents: number): string { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100); }
