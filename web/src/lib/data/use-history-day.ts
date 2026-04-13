import { useQuery } from "@tanstack/react-query";
import type { Reading } from "@/lib/types/record";
import { fetchReadings, previousIsoDate } from "./fetch-readings";

type HistoryDayQueryKey = readonly ["history-day", string];

/**
 * Readings for `target_date` X live in `(X-1).jsonl` — the scraper records
 * today's observations for tomorrow's availability. Same-day files never
 * carry readings with matching target_date, so we fetch only the previous
 * day's file and defensively filter.
 */
async function fetchReadingsForTargetDate(targetDate: string) {
  const observationDate = previousIsoDate(targetDate);
  const readings = await fetchReadings(observationDate);
  return readings.filter((r) => r.target_date === targetDate);
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
