const SECONDS_IN_DAY = 24 * 3600;

/** Parses `HH:MM:SS` (or `HH:MM`) into seconds-of-day. Missing parts default to 0. */
export function timeToSeconds(time: string): number {
  const [h, m, s] = time.split(":").map((p) => Number.parseInt(p, 10));
  return (h ?? 0) * 3600 + (m ?? 0) * 60 + (s ?? 0);
}

/** Formats seconds-of-day into `HH:MM`, wrapping across midnight. */
export function secondsToHHMM(total: number): string {
  const normalized =
    ((Math.round(total) % SECONDS_IN_DAY) + SECONDS_IN_DAY) % SECONDS_IN_DAY;
  const h = Math.floor(normalized / 3600);
  const m = Math.floor((normalized % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
