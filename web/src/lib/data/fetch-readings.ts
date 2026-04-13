import type { Reading } from "@/lib/types/record";
import { parseJsonl } from "./parse";

const REPO = "jovandyaz/machupicchu-ticket-tracker";

export function buildReadingsUrl(isoDate: string): string {
  const [y, m] = isoDate.split("-");
  return `https://raw.githubusercontent.com/${REPO}/main/data/${y}/${m}/${isoDate}.jsonl`;
}

/**
 * Return the ISO date (YYYY-MM-DD) one day before `isoDate`. Handles month/year
 * rollovers. Used to map a calendar cell (`target_date`) to the observation
 * day that holds its readings (sales happen the day before the target).
 */
export function previousIsoDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  const yy = prev.getUTCFullYear();
  const mm = String(prev.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(prev.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Fetch readings for an arbitrary ISO date. Returns `[]` if the day has no
 * file (scraper offline or day in the future).
 */
export async function fetchReadings(isoDate: string): Promise<Reading[]> {
  const res = await fetch(buildReadingsUrl(isoDate), { cache: "no-store" });
  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(`Failed to fetch readings for ${isoDate}: ${res.status}`);
  }
  return parseJsonl(await res.text());
}
