import { formatPeruDate } from "./fetch-today";

const DAY_MS = 24 * 60 * 60 * 1000;

export const FUTURE_DAY_OFFSETS = [1, 2, 3] as const;

export type TargetDateTuple = readonly [string, string, string];

export function computeTargetDates(now: Date = new Date()): TargetDateTuple {
  const [d1, d2, d3] = FUTURE_DAY_OFFSETS.map((offset) =>
    formatPeruDate(new Date(now.getTime() + offset * DAY_MS)),
  );
  return [d1!, d2!, d3!] as const;
}
