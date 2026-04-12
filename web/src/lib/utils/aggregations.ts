import type { DailySummary, Patterns } from "@/lib/types/aggregates";

/**
 * Occupancy buckets used by the history heatmap. The last tier collapses
 * "sold-out" (occupancy >= 1) into its own bucket so we can render a distinct
 * color for days that hit zero availability.
 */
export type HeatmapBucket =
  | "empty"
  | "low"
  | "mid"
  | "high"
  | "peak"
  | "sold-out";

export function bucketFor(summary: DailySummary | undefined): HeatmapBucket {
  if (!summary || summary.total_capacity <= 0) return "empty";
  if (summary.sold_out_time) return "sold-out";
  const pct = summary.total_sold / summary.total_capacity;
  if (pct >= 1) return "sold-out";
  if (pct >= 0.75) return "peak";
  if (pct >= 0.5) return "high";
  if (pct >= 0.25) return "mid";
  return "low";
}

/** Finds the top-selling route for a given day summary. Null on empty. */
export function topRoute(
  summary: DailySummary,
): { route: string; sold: number } | null {
  const entries = Object.entries(summary.by_route);
  if (entries.length === 0) return null;
  let best: { route: string; sold: number } | null = null;
  for (const [route, sold] of entries) {
    if (!best || sold > best.sold) best = { route, sold };
  }
  return best;
}

/**
 * Returns the argmax index of a numeric array, or -1 if all values are zero
 * (or the array is empty). Treats ties by returning the first.
 */
export function argmaxNonZero(values: readonly number[]): number {
  let idx = -1;
  let max = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i] ?? 0;
    if (v > max) {
      max = v;
      idx = i;
    }
  }
  return idx;
}

const SPANISH_WEEKDAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export function weekdayLabel(index: number): string {
  return SPANISH_WEEKDAYS[index] ?? "—";
}

const SHORT_WEEKDAYS = [
  "Dom",
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
] as const;

export function shortWeekday(index: number): string {
  return SHORT_WEEKDAYS[index] ?? "—";
}

export interface TopMonth {
  month: string;
  occupancy: number;
}

/**
 * Picks the month with the highest average occupancy, or null if the map is
 * empty / all zero.
 */
export function topMonth(by_month: Patterns["by_month"]): TopMonth | null {
  const entries = Object.entries(by_month);
  if (entries.length === 0) return null;
  let best: TopMonth | null = null;
  for (const [month, occupancy] of entries) {
    if (!best || occupancy > best.occupancy) best = { month, occupancy };
  }
  if (!best || best.occupancy <= 0) return null;
  return best;
}

/** True if every value in the array is zero (or array is empty). */
export function allZero(values: readonly number[]): boolean {
  return values.every((v) => v === 0);
}

/**
 * Parses "YYYY-MM-DD" into a UTC Date at midnight. Avoids timezone drift
 * from `new Date(string)` which interprets as local time when time is absent
 * on some runtimes.
 */
export function parseIsoDate(date: string): Date {
  const [y, m, d] = date.split("-").map((p) => Number.parseInt(p, 10));
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

/** Returns the day-of-week (0 = Sunday … 6 = Saturday) for a YYYY-MM-DD. */
export function weekdayOf(date: string): number {
  return parseIsoDate(date).getUTCDay();
}

export interface HeatmapCell {
  date: string; // YYYY-MM-DD
  weekday: number; // 0..6
  weekIndex: number; // 0-based column in the grid
  summary?: DailySummary;
}

/**
 * Builds a GitHub-style calendar heatmap grid ending on `endDate` and
 * spanning `months` months back. Weeks are columns, weekdays are rows
 * (0 = Sunday … 6 = Saturday). Days without a matching summary still
 * produce a cell so the grid layout is uniform.
 */
export function buildHeatmapGrid(
  summaries: readonly DailySummary[],
  endDate: Date,
  months: number,
): HeatmapCell[] {
  const byDate = new Map<string, DailySummary>();
  for (const s of summaries) byDate.set(s.date, s);

  // Start from `months` months before the first day of endDate's month.
  const end = new Date(
    Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
    ),
  );
  const start = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - months + 1, 1),
  );
  // Roll back to the previous Sunday so the grid is aligned by week.
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  const cells: HeatmapCell[] = [];
  const cursor = new Date(start);
  let weekIndex = 0;
  while (cursor <= end) {
    const weekday = cursor.getUTCDay();
    const iso = cursor.toISOString().slice(0, 10);
    cells.push({
      date: iso,
      weekday,
      weekIndex,
      summary: byDate.get(iso),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (cursor.getUTCDay() === 0) weekIndex += 1;
  }
  return cells;
}
