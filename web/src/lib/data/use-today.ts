import { type Query, useQuery } from "@tanstack/react-query";
import { fetchToday, formatPeruDate, getPeruHour } from "./fetch-today";
import type { Reading } from "@/lib/types/record";

type TodayQueryKey = readonly ["today", string];

/**
 * Returns true when we should be polling for live sales data:
 * within the office-hours window AND not already sold-out.
 */
export function isPollingActive(
  data: Reading[] | undefined,
  now: Date = new Date(),
): boolean {
  const hour = getPeruHour(now);
  if (hour >= 22 || hour < 5) return false;
  if (data && data.length > 0) {
    const last = data[data.length - 1]!;
    if (last.total_available === 0) return false;
  }
  return true;
}

function refetchIntervalFor(
  query: Query<Reading[], Error, Reading[], TodayQueryKey>,
): number | false {
  return isPollingActive(query.state.data) ? 60_000 : false;
}

export function useTodayQuery() {
  const today = formatPeruDate(new Date());
  return useQuery<Reading[], Error, Reading[], TodayQueryKey>({
    queryKey: ["today", today] as const,
    queryFn: () => fetchToday(new Date()),
    refetchInterval: refetchIntervalFor,
    staleTime: 30_000,
  });
}
