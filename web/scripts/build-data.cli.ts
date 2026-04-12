#!/usr/bin/env node
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import {
  computeDailySummary,
  computePatterns,
  computeRouteStats,
} from "./build-data";
import { parseJsonl } from "../src/lib/data/parse";
import type { DailySummary } from "../src/lib/types/aggregates";
import { routeFileSlug } from "../src/lib/utils/route-id";

const DATA_DIR = resolve(process.cwd(), "..", "data");
const OUT_DIR = resolve(process.cwd(), "public", "data");

function walkJsonl(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") || entry === "daily-totals") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkJsonl(full));
    else if (entry.endsWith(".jsonl")) out.push(full);
  }
  return out;
}

function main(): void {
  const files = walkJsonl(DATA_DIR);
  if (files.length === 0) {
    console.warn("No JSONL files found in", DATA_DIR);
    return;
  }

  const allReadings = files.flatMap((f) => parseJsonl(readFileSync(f, "utf8")));

  const byDate = new Map<string, typeof allReadings>();
  for (const r of allReadings) {
    const list = byDate.get(r.target_date);
    if (list) list.push(r);
    else byDate.set(r.target_date, [r]);
  }

  const dailyIndex: DailySummary[] = [...byDate.values()]
    .map(computeDailySummary)
    .filter((x): x is DailySummary => x !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(join(OUT_DIR, "history"), { recursive: true });
  mkdirSync(join(OUT_DIR, "routes"), { recursive: true });

  writeFileSync(
    join(OUT_DIR, "daily-index.json"),
    JSON.stringify(dailyIndex, null, 2),
  );

  const byMonth = new Map<string, DailySummary[]>();
  for (const d of dailyIndex) {
    const m = d.date.slice(0, 7);
    const list = byMonth.get(m);
    if (list) list.push(d);
    else byMonth.set(m, [d]);
  }
  for (const [m, days] of byMonth) {
    writeFileSync(
      join(OUT_DIR, "history", `${m}.json`),
      JSON.stringify({ month: m, days }, null, 2),
    );
  }

  const routeStats = computeRouteStats(allReadings);
  for (const stat of routeStats) {
    const slug = routeFileSlug(stat.route);
    writeFileSync(
      join(OUT_DIR, "routes", `${slug}.json`),
      JSON.stringify(stat, null, 2),
    );
  }

  const patterns = computePatterns(allReadings);
  writeFileSync(
    join(OUT_DIR, "patterns.json"),
    JSON.stringify(patterns, null, 2),
  );

  console.log(
    `✓ Wrote ${dailyIndex.length} daily summaries · ${routeStats.length} routes · 1 patterns.json`,
  );
}

main();
