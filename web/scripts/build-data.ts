import type { Reading } from "../src/lib/types/record";
import type {
  DailySummary,
  Patterns,
  RouteStats,
} from "../src/lib/types/aggregates";
import { secondsToHHMM, timeToSeconds } from "../src/lib/utils/time";

function sortByTime(readings: Reading[]): Reading[] {
  return [...readings].sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
}

export function computeDailySummary(readings: Reading[]): DailySummary | null {
  if (readings.length === 0) return null;

  const sorted = sortByTime(readings);
  const last = sorted[sorted.length - 1]!;
  const first = sorted[0]!;

  const by_route: Record<string, number> = {};
  for (const r of last.routes) {
    by_route[r.route] = r.sold;
  }

  const soldOutReading = sorted.find((r) => r.total_available === 0);
  const firstActivity = sorted.find((r) => r.total_sold > 0);

  // Peak hour: bucket deltas by the hour of the LATER reading in each pair.
  const hourDeltas = new Map<number, number>();
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    const delta = cur.total_sold - prev.total_sold;
    if (delta <= 0) continue;
    const hour = parseInt(cur.time.slice(0, 2), 10);
    hourDeltas.set(hour, (hourDeltas.get(hour) ?? 0) + delta);
  }

  let peak_hour: number | undefined;
  let maxDelta = 0;
  for (const [hour, delta] of hourDeltas) {
    if (delta > maxDelta) {
      maxDelta = delta;
      peak_hour = hour;
    }
  }

  return {
    date: first.target_date,
    target_date: first.target_date,
    total_sold: last.total_sold,
    total_capacity: last.total_capacity,
    ...(soldOutReading ? { sold_out_time: soldOutReading.time } : {}),
    ...(peak_hour !== undefined ? { peak_hour } : {}),
    ...(firstActivity ? { first_reading: firstActivity.time } : {}),
    by_route,
  };
}

function groupByTargetDate(readings: Reading[]): Map<string, Reading[]> {
  const map = new Map<string, Reading[]>();
  for (const r of readings) {
    const list = map.get(r.target_date);
    if (list) list.push(r);
    else map.set(r.target_date, [r]);
  }
  return map;
}

interface RouteMeta {
  circuit: string;
  capacity: number;
}

interface RouteDayEntry {
  date: string;
  sold: number;
  capacity: number;
  sold_out_time?: string;
  first_activity_time?: string;
  last_time: string;
}

function collectRouteMeta(readings: Reading[]): {
  order: string[];
  meta: Map<string, RouteMeta>;
} {
  const order: string[] = [];
  const meta = new Map<string, RouteMeta>();
  for (const r of readings) {
    for (const rr of r.routes) {
      if (!meta.has(rr.route)) {
        meta.set(rr.route, { circuit: rr.circuit, capacity: rr.capacity });
        order.push(rr.route);
      }
    }
  }
  return { order, meta };
}

function distinctTargetDatesInOrder(readings: Reading[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const r of readings) {
    if (!seen.has(r.target_date)) {
      seen.add(r.target_date);
      order.push(r.target_date);
    }
  }
  return order;
}

/**
 * Walks one day of sorted readings for a specific route and returns the
 * aggregated day entry. Returns null if the route has no readings that day.
 */
function buildRouteDayEntry(
  route: string,
  capacity: number,
  date: string,
  dayReadings: Reading[],
): RouteDayEntry | null {
  let seen = false;
  let finalSold = 0;
  let soldOutTime: string | undefined;
  let firstActivity: string | undefined;
  for (const reading of dayReadings) {
    const rr = reading.routes.find((x) => x.route === route);
    if (!rr) continue;
    seen = true;
    finalSold = rr.sold;
    if (soldOutTime === undefined && rr.available === 0) {
      soldOutTime = reading.time;
    }
    if (firstActivity === undefined && rr.sold > 0) {
      firstActivity = reading.time;
    }
  }
  if (!seen) return null;
  return {
    date,
    sold: finalSold,
    capacity,
    last_time: dayReadings[dayReadings.length - 1]!.time,
    ...(soldOutTime ? { sold_out_time: soldOutTime } : {}),
    ...(firstActivity ? { first_activity_time: firstActivity } : {}),
  };
}

/** Tickets/hour for one day. Zero if the day never saw activity or the span is non-positive. */
function velocityForEntry(entry: RouteDayEntry): number {
  if (!entry.first_activity_time) return 0;
  const endTime = entry.sold_out_time ?? entry.last_time;
  const hours =
    (timeToSeconds(endTime) - timeToSeconds(entry.first_activity_time)) / 3600;
  if (hours <= 0) return 0;
  return entry.sold / hours;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function averageTimeOfDay(times: string[]): string | undefined {
  if (times.length === 0) return undefined;
  const seconds = times.map(timeToSeconds);
  const avg = seconds.reduce((a, b) => a + b, 0) / seconds.length;
  return secondsToHHMM(avg);
}

function summarizeRouteEntries(
  route: string,
  meta: RouteMeta,
  entries: RouteDayEntry[],
): RouteStats {
  const occupancies = entries.map((e) =>
    e.capacity > 0 ? e.sold / e.capacity : 0,
  );
  const soldOutTimes = entries
    .map((e) => e.sold_out_time)
    .filter((t): t is string => !!t);
  const avgSoldOut = averageTimeOfDay(soldOutTimes);
  return {
    route,
    circuit: meta.circuit,
    capacity: meta.capacity,
    sold_out_count: soldOutTimes.length,
    avg_occupancy: mean(occupancies),
    avg_velocity: mean(entries.map(velocityForEntry)),
    ...(avgSoldOut ? { avg_sold_out_time: avgSoldOut } : {}),
    history: entries.map((e) => ({
      date: e.date,
      sold: e.sold,
      ...(e.sold_out_time ? { sold_out_time: e.sold_out_time } : {}),
    })),
  };
}

export function computeRouteStats(readings: Reading[]): RouteStats[] {
  if (readings.length === 0) return [];

  const { order: routeOrder, meta: routeMeta } = collectRouteMeta(readings);
  const byDate = groupByTargetDate(readings);
  const dateOrder = distinctTargetDatesInOrder(readings);

  const perRoute = new Map<string, RouteDayEntry[]>(
    routeOrder.map((name) => [name, []]),
  );

  for (const date of dateOrder) {
    const dayReadings = sortByTime(byDate.get(date) ?? []);
    if (dayReadings.length === 0) continue;
    for (const name of routeOrder) {
      const entry = buildRouteDayEntry(
        name,
        routeMeta.get(name)!.capacity,
        date,
        dayReadings,
      );
      if (entry) perRoute.get(name)!.push(entry);
    }
  }

  return routeOrder.map((name) =>
    summarizeRouteEntries(name, routeMeta.get(name)!, perRoute.get(name) ?? []),
  );
}

export function computePatterns(readings: Reading[]): Patterns {
  const by_hour: number[] = new Array(24).fill(0);
  const by_weekday: number[] = new Array(7).fill(0);
  const by_month: Record<string, number> = {};

  if (readings.length === 0) {
    return { by_hour, by_weekday, by_month };
  }

  const byDate = groupByTargetDate(readings);

  // by_hour: collect deltas per hour-of-day, per day. Then average.
  // hourSums[h] = sum of deltas across days, hourDays[h] = number of days with any delta in that hour.
  const hourSums: number[] = new Array(24).fill(0);
  const hourDayCounts: number[] = new Array(24).fill(0);

  // by_weekday: sum of final total_sold per weekday and count of days.
  const weekdaySums: number[] = new Array(7).fill(0);
  const weekdayCounts: number[] = new Array(7).fill(0);

  // by_month: sum of occupancy per month and count of days.
  const monthSums = new Map<string, number>();
  const monthCounts = new Map<string, number>();

  for (const [date, list] of byDate) {
    const sorted = sortByTime(list);
    if (sorted.length === 0) continue;
    const last = sorted[sorted.length - 1]!;

    // by_hour: track per-day hour deltas; each hour that had any delta contributes once to its day count.
    const perDayHourDeltas = new Map<number, number>();
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]!;
      const cur = sorted[i]!;
      const delta = cur.total_sold - prev.total_sold;
      const hour = parseInt(cur.time.slice(0, 2), 10);
      perDayHourDeltas.set(hour, (perDayHourDeltas.get(hour) ?? 0) + delta);
    }
    for (const [hour, delta] of perDayHourDeltas) {
      hourSums[hour] = (hourSums[hour] ?? 0) + delta;
      hourDayCounts[hour] = (hourDayCounts[hour] ?? 0) + 1;
    }

    // by_weekday
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    weekdaySums[weekday] = (weekdaySums[weekday] ?? 0) + last.total_sold;
    weekdayCounts[weekday] = (weekdayCounts[weekday] ?? 0) + 1;

    // by_month
    const month = date.slice(0, 7);
    const occupancy =
      last.total_capacity > 0 ? last.total_sold / last.total_capacity : 0;
    monthSums.set(month, (monthSums.get(month) ?? 0) + occupancy);
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
  }

  for (let h = 0; h < 24; h++) {
    const count = hourDayCounts[h] ?? 0;
    by_hour[h] = count > 0 ? (hourSums[h] ?? 0) / count : 0;
  }
  for (let w = 0; w < 7; w++) {
    const count = weekdayCounts[w] ?? 0;
    by_weekday[w] = count > 0 ? (weekdaySums[w] ?? 0) / count : 0;
  }
  for (const [month, sum] of monthSums) {
    const count = monthCounts.get(month) ?? 1;
    by_month[month] = sum / count;
  }

  return { by_hour, by_weekday, by_month };
}
