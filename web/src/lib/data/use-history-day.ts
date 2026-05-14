import { useQuery } from "@tanstack/react-query";
import type { Reading } from "@/lib/types/record";
import { fetchReadings, previousIsoDate } from "./fetch-readings";

type HistoryDayQueryKey = readonly ["history-day", string];

const FUTURE_DAYS_CAPTURED = 3;

/**
 * Readings for `target_date` X live in `(X-1).jsonl`, `(X-2).jsonl` and
 * `(X-3).jsonl` — the scraper records observations for the next 3 future
 * visit dates each tick. We fetch all candidate observation files in parallel
 * and filter by `target_date`.
 */
async function fetchReadingsForTargetDate(targetDate: string) {
  const observationDates: string[] = [];
  let cursor = targetDate;
  for (let i = 0; i < FUTURE_DAYS_CAPTURED; i++) {
    cursor = previousIsoDate(cursor);
    observationDates.push(cursor);
  }
  const results = await Promise.all(observationDates.map(fetchReadings));
  return results.flat().filter((r) => r.target_date === targetDate);
}

export function useHistoryDayQuery(targetDate: string | null) {
  return useQuery<Reading[], Error, Reading[], HistoryDayQueryKey>({
    queryKey: ["history-day", targetDate ?? ""] as const,
    queryFn: () => fetchReadingsForTargetDate(targetDate!),
    enabled: Boolean(targetDate),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 10 * 60_000,
  });
}
