# Astro Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a public Astro + React dashboard that visualizes Machu Picchu ticket availability data collected by the existing GitHub Actions tracker, deployed to GitHub Pages.

**Architecture:** Static Astro site with React islands for interactivity. Historical views consume pre-computed JSON aggregates built from `data/*.jsonl`. The "Today" view polls raw JSONL from GitHub via TanStack Query (SWR pattern) with conditional refetch. Folder structure ready to migrate to pnpm workspaces without refactor.

**Tech Stack:** Astro 5, React 18, TypeScript strict, Tailwind v4, shadcn/ui Chart, Recharts v3, TanStack Query, Zod, Motion, Vitest, pnpm, GitHub Pages.

**Related design:** `docs/plans/2026-04-12-astro-dashboard-design.md`

---

## Phase 0 — Project scaffolding

### Task 0.1: Initialize `web/` with Astro + TypeScript strict

**Files:**
- Create: `web/` (via Astro CLI)

**Step 1:** From repo root, run:
```bash
pnpm create astro@latest web -- --template minimal --typescript strict --install --no-git --skip-houston
```

**Step 2:** Verify `web/package.json` has `astro ^5`, `web/tsconfig.json` extends `astro/tsconfigs/strict`.

**Step 3:** Add root `.gitignore` entries (if missing):
```
web/node_modules
web/dist
web/.astro
web/.turbo
```

**Step 4:** Commit:
```bash
git add web/ .gitignore
git commit -m "chore: scaffold astro project in web/"
```

---

### Task 0.2: Configure TypeScript strict + path aliases

**Files:**
- Modify: `web/tsconfig.json`

**Step 1:** Replace contents with:
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@lib/*": ["src/lib/*"],
      "@layouts/*": ["src/layouts/*"],
      "@types/*": ["src/lib/types/*"]
    },
    "verbatimModuleSyntax": true,
    "noUncheckedIndexedAccess": true,
    "jsx": "react-jsx"
  },
  "include": [".astro/types.d.ts", "**/*", "scripts/**/*"],
  "exclude": ["dist"]
}
```

**Step 2:** Run `cd web && pnpm astro check` → expect 0 errors.

**Step 3:** Commit:
```bash
git add web/tsconfig.json
git commit -m "chore(web): configure ts strict with path aliases"
```

---

### Task 0.3: Install React, Tailwind v4, TanStack Query, core deps

**Files:**
- Modify: `web/package.json`
- Create: `web/astro.config.ts`

**Step 1:** From `web/`:
```bash
pnpm astro add react tailwind
pnpm add @tanstack/react-query zod motion clsx tailwind-merge lucide-react recharts
pnpm add -D @types/react @types/react-dom vitest @vitest/ui prettier prettier-plugin-astro prettier-plugin-tailwindcss
```

**Step 2:** Verify `web/astro.config.ts` has React + Tailwind integrations enabled.

**Step 3:** Commit:
```bash
git add web/package.json web/pnpm-lock.yaml web/astro.config.ts
git commit -m "chore(web): install react, tailwind v4, tanstack query, charts deps"
```

---

### Task 0.4: Set up Tailwind v4 theme tokens (design system)

**Files:**
- Create: `web/src/styles/globals.css`
- Modify: `web/astro.config.ts` (if needed for Tailwind v4 `@import`)

**Step 1:** Create `web/src/styles/globals.css`:
```css
@import "tailwindcss";

@theme {
  /* Dark palette — retrofuturist Inca cartography */
  --color-bg: #1a1714;
  --color-surface: #221e1a;
  --color-surface-elevated: #2b2620;
  --color-border: #3a3229;
  --color-fg: #e8ddc7;
  --color-fg-muted: #9b8f7a;
  --color-fg-subtle: #5a5043;

  --color-accent: #d4a537;
  --color-accent-electric: #2dd4bf;
  --color-success: #7a9b5f;
  --color-warning: #c97c2c;
  --color-danger: #a63d2a;

  --font-display: "Fraunces", Georgia, serif;
  --font-sans: "Instrument Sans", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 6px;
}

html, body {
  background-color: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-sans);
}

/* Subtle grain overlay */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.03;
  z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

**Step 2:** Commit:
```bash
git add web/src/styles/globals.css web/astro.config.ts
git commit -m "feat(web): add design tokens and global styles"
```

---

### Task 0.5: Add font loading (Fraunces, Instrument Sans, JetBrains Mono)

**Files:**
- Create: `web/src/layouts/Base.astro`

**Step 1:** Create minimal layout with Google Fonts preconnect + link:
```astro
---
import "@/styles/globals.css";
const { title = "Machu Picchu Ticket Log" } = Astro.props;
---
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

**Step 2:** Update `web/src/pages/index.astro` to use `<Base>`:
```astro
---
import Base from "@layouts/Base.astro";
---
<Base>
  <h1 class="font-display text-4xl p-8">Machu Picchu Ticket Log</h1>
  <p class="font-sans text-fg-muted px-8">Scaffold working.</p>
</Base>
```

**Step 3:** Run `cd web && pnpm dev` → open `http://localhost:4321` → verify fonts load and dark theme renders.

**Step 4:** Commit:
```bash
git add web/src/layouts/Base.astro web/src/pages/index.astro
git commit -m "feat(web): add base layout with typography"
```

---

## Phase 1 — Type contracts + data pipeline

### Task 1.1: Define TS types + Zod schemas for JSONL records

**Files:**
- Create: `web/src/lib/types/record.ts`
- Create: `web/src/lib/types/aggregates.ts`

**Step 1:** Write `web/src/lib/types/record.ts`:
```ts
import { z } from "zod";

export const RouteReadingSchema = z.object({
  route: z.string(),
  circuit: z.string(),
  capacity: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
  sold: z.number().int().nonnegative(),
});
export type RouteReading = z.infer<typeof RouteReadingSchema>;

export const ReadingSchema = z.object({
  timestamp: z.string(),
  date: z.string(),
  time: z.string(),
  target_date: z.string(),
  tickets_sold_today: z.number().int().nullable(),
  total_capacity: z.number().int(),
  total_sold: z.number().int(),
  total_available: z.number().int(),
  routes: z.array(RouteReadingSchema),
});
export type Reading = z.infer<typeof ReadingSchema>;
```

**Step 2:** Write `web/src/lib/types/aggregates.ts`:
```ts
import type { RouteReading } from "./record";

export interface DailySummary {
  date: string;           // YYYY-MM-DD (target date)
  target_date: string;
  total_sold: number;
  total_capacity: number;
  sold_out_time?: string; // HH:MM:SS when all routes hit 0 available
  peak_hour?: number;     // hour with most sales delta
  first_reading?: string; // time of first non-zero reading
  by_route: Record<string, number>; // route name → final sold count
}

export interface MonthHistory {
  month: string;          // YYYY-MM
  days: DailySummary[];
}

export interface RouteStats {
  route: string;
  circuit: string;
  capacity: number;
  sold_out_count: number;
  avg_occupancy: number;  // 0..1
  avg_velocity: number;   // tickets per hour
  history: Array<{ date: string; sold: number; sold_out_time?: string }>;
}

export interface Patterns {
  by_hour: number[];           // 24 values, avg sales delta per hour
  by_weekday: number[];        // 7 values, avg total sold per weekday (0=Sun)
  by_month: Record<string, number>; // YYYY-MM → avg occupancy
}
```

**Step 3:** Run `cd web && pnpm astro check` → expect 0 errors.

**Step 4:** Commit:
```bash
git add web/src/lib/types/
git commit -m "feat(web): add type contracts and zod schemas for data"
```

---

### Task 1.2: Write Vitest config + first test for JSONL parser

**Files:**
- Create: `web/vitest.config.ts`
- Create: `web/scripts/build-data.ts` (stub)
- Create: `web/scripts/__tests__/parse-jsonl.test.ts`

**Step 1:** Create `web/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["scripts/**/*.test.ts", "src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@lib": resolve(__dirname, "src/lib"),
      "@types": resolve(__dirname, "src/lib/types"),
    },
  },
});
```

**Step 2:** Create `web/scripts/build-data.ts` with a stub:
```ts
import { ReadingSchema, type Reading } from "@types/record";

export function parseJsonl(raw: string): Reading[] {
  return raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line, idx) => {
      try {
        return ReadingSchema.parse(JSON.parse(line));
      } catch (err) {
        throw new Error(`Invalid JSONL at line ${idx + 1}: ${(err as Error).message}`);
      }
    });
}
```

**Step 3:** Write failing test `web/scripts/__tests__/parse-jsonl.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseJsonl } from "../build-data";

const validLine = JSON.stringify({
  timestamp: "2026-04-12T08:30:00",
  date: "2026-04-12",
  time: "08:30:00",
  target_date: "2026-04-13",
  tickets_sold_today: 100,
  total_capacity: 1000,
  total_sold: 80,
  total_available: 920,
  routes: [{ route: "Ruta 2-A", circuit: "Circuito 2", capacity: 600, available: 520, sold: 80 }],
});

describe("parseJsonl", () => {
  it("parses multiple valid lines", () => {
    const result = parseJsonl([validLine, validLine].join("\n"));
    expect(result).toHaveLength(2);
    expect(result[0].total_sold).toBe(80);
  });

  it("ignores empty lines and trailing newline", () => {
    const result = parseJsonl(`${validLine}\n\n${validLine}\n`);
    expect(result).toHaveLength(2);
  });

  it("throws with line number on malformed JSON", () => {
    expect(() => parseJsonl(`${validLine}\nnot-json`)).toThrow(/line 2/);
  });

  it("throws on schema mismatch", () => {
    const bad = JSON.stringify({ ...JSON.parse(validLine), total_sold: "oops" });
    expect(() => parseJsonl(bad)).toThrow();
  });
});
```

**Step 4:** Run: `cd web && pnpm vitest run scripts/__tests__/parse-jsonl.test.ts`
Expected: all 4 tests PASS (parser is already correct; TDD-style we verify behavior).

**Step 5:** Commit:
```bash
git add web/vitest.config.ts web/scripts/
git commit -m "feat(web): add jsonl parser with zod validation and tests"
```

---

### Task 1.3: Implement + test `computeDailySummary`

**Files:**
- Modify: `web/scripts/build-data.ts`
- Create: `web/scripts/__tests__/compute-daily-summary.test.ts`

**Step 1:** Write failing test first:
```ts
import { describe, it, expect } from "vitest";
import { computeDailySummary } from "../build-data";
import type { Reading } from "@types/record";

function mkReading(time: string, totalSold: number, totalAvailable: number, routes: Reading["routes"]): Reading {
  return {
    timestamp: `2026-04-12T${time}`,
    date: "2026-04-12",
    time,
    target_date: "2026-04-13",
    tickets_sold_today: totalSold,
    total_capacity: 1000,
    total_sold: totalSold,
    total_available: totalAvailable,
    routes,
  };
}

describe("computeDailySummary", () => {
  it("returns null for empty readings", () => {
    expect(computeDailySummary([])).toBeNull();
  });

  it("computes final sold count by route", () => {
    const r = [
      mkReading("06:00:00", 0, 1000, [{ route: "Ruta 2-A", circuit: "C2", capacity: 600, available: 600, sold: 0 }]),
      mkReading("18:00:00", 500, 500, [{ route: "Ruta 2-A", circuit: "C2", capacity: 600, available: 100, sold: 500 }]),
    ];
    const summary = computeDailySummary(r);
    expect(summary?.total_sold).toBe(500);
    expect(summary?.by_route["Ruta 2-A"]).toBe(500);
  });

  it("detects sold_out_time when total_available hits 0", () => {
    const r = [
      mkReading("06:00:00", 0, 1000, []),
      mkReading("14:30:00", 1000, 0, []),
    ];
    expect(computeDailySummary(r)?.sold_out_time).toBe("14:30:00");
  });
});
```

**Step 2:** Run test → expect FAIL (function not exported yet).

**Step 3:** Add to `web/scripts/build-data.ts`:
```ts
import type { DailySummary } from "@types/aggregates";

export function computeDailySummary(readings: Reading[]): DailySummary | null {
  if (readings.length === 0) return null;
  const sorted = [...readings].sort((a, b) => a.time.localeCompare(b.time));
  const last = sorted[sorted.length - 1]!;

  const soldOut = sorted.find((r) => r.total_available === 0);

  const by_route: Record<string, number> = {};
  for (const route of last.routes) by_route[route.route] = route.sold;

  return {
    date: last.date,
    target_date: last.target_date,
    total_sold: last.total_sold,
    total_capacity: last.total_capacity,
    sold_out_time: soldOut?.time,
    by_route,
  };
}
```

**Step 4:** Run test → expect PASS.

**Step 5:** Commit:
```bash
git add web/scripts/
git commit -m "feat(web): add computeDailySummary with tdd"
```

---

### Task 1.4: Implement + test remaining aggregators

**Files:**
- Modify: `web/scripts/build-data.ts`
- Create: `web/scripts/__tests__/aggregates.test.ts`

**Step 1:** Write failing tests for:
- `computePeakHour(readings)` — returns hour with largest delta in `total_sold`
- `computeFirstReading(readings)` — earliest time with non-zero total_sold
- `computeRouteStats(readings[])` — aggregate across multiple days
- `computePatterns(readings[])` — by_hour, by_weekday, by_month

**Step 2:** Run tests → FAIL.

**Step 3:** Implement each function in `build-data.ts`.

**Step 4:** Run tests → PASS.

**Step 5:** Commit:
```bash
git add web/scripts/
git commit -m "feat(web): add peak-hour, route stats, and pattern aggregators"
```

---

### Task 1.5: Build data pipeline CLI script

**Files:**
- Create: `web/scripts/build-data.cli.ts`
- Modify: `web/package.json` (add script)

**Step 1:** Create `web/scripts/build-data.cli.ts`:
```ts
#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  parseJsonl,
  computeDailySummary,
  computeRouteStats,
  computePatterns,
} from "./build-data";

const DATA_DIR = resolve(process.cwd(), "..", "data");
const OUT_DIR = resolve(process.cwd(), "public", "data");

function walkJsonl(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkJsonl(full));
    else if (entry.endsWith(".jsonl")) out.push(full);
  }
  return out;
}

function main() {
  const files = walkJsonl(DATA_DIR);
  const allReadings = files.flatMap((f) => parseJsonl(readFileSync(f, "utf8")));

  // Group by target_date
  const byDate = new Map<string, typeof allReadings>();
  for (const r of allReadings) {
    const list = byDate.get(r.target_date) ?? [];
    list.push(r);
    byDate.set(r.target_date, list);
  }

  const dailyIndex = [...byDate.entries()]
    .map(([, readings]) => computeDailySummary(readings))
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(join(OUT_DIR, "history"), { recursive: true });
  mkdirSync(join(OUT_DIR, "routes"), { recursive: true });

  writeFileSync(join(OUT_DIR, "daily-index.json"), JSON.stringify(dailyIndex, null, 2));

  // Group daily summaries by month
  const byMonth = new Map<string, typeof dailyIndex>();
  for (const d of dailyIndex) {
    const m = d.date.slice(0, 7);
    byMonth.set(m, [...(byMonth.get(m) ?? []), d]);
  }
  for (const [m, days] of byMonth) {
    writeFileSync(join(OUT_DIR, "history", `${m}.json`), JSON.stringify({ month: m, days }, null, 2));
  }

  const routeStats = computeRouteStats(allReadings);
  for (const stat of routeStats) {
    const slug = stat.route.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    writeFileSync(join(OUT_DIR, "routes", `${slug}.json`), JSON.stringify(stat, null, 2));
  }

  const patterns = computePatterns(allReadings);
  writeFileSync(join(OUT_DIR, "patterns.json"), JSON.stringify(patterns, null, 2));

  console.log(`✓ Wrote ${dailyIndex.length} daily summaries, ${routeStats.length} routes, 1 patterns.json`);
}

main();
```

**Step 2:** Add script to `web/package.json`:
```json
{
  "scripts": {
    "build:data": "tsx scripts/build-data.cli.ts",
    "build": "pnpm build:data && astro build",
    "dev": "astro dev",
    "test": "vitest run",
    "check": "astro check"
  }
}
```

**Step 3:** Install `tsx` as dev dep:
```bash
cd web && pnpm add -D tsx
```

**Step 4:** Run `cd web && pnpm build:data` → verify `public/data/daily-index.json` exists and has data.

**Step 5:** Commit:
```bash
git add web/scripts/build-data.cli.ts web/package.json web/pnpm-lock.yaml
git commit -m "feat(web): add build-data cli to preprocess jsonl"
```

---

## Phase 2 — UI components foundation

### Task 2.1: Install shadcn/ui primitives (Card, Badge, Progress)

**Files:**
- Create: `web/components.json`
- Create: `web/src/components/ui/` (card, badge, progress)

**Step 1:** From `web/`:
```bash
pnpm dlx shadcn@latest init
```
Answer prompts: TypeScript yes, style "new-york", CSS variables yes, default color slate (we override), components dir `src/components/ui`, utils `src/lib/utils`.

**Step 2:**
```bash
pnpm dlx shadcn@latest add card badge progress chart
```

**Step 3:** Verify files under `web/src/components/ui/` and `web/src/lib/utils.ts` (cn helper) exist.

**Step 4:** Commit:
```bash
git add web/components.json web/src/components/ui web/src/lib/utils.ts
git commit -m "feat(web): add shadcn ui primitives (card, badge, progress, chart)"
```

---

### Task 2.2: Build `<Sidebar>` React island

**Files:**
- Create: `web/src/components/islands/Sidebar.tsx`
- Modify: `web/src/layouts/Base.astro`

**Step 1:** Create `Sidebar.tsx` with 240px fixed width, collapsible mini-drawer at `<md`:
```tsx
import { useState } from "react";
import { MapPin, Compass, Route, ChartLine, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { href: "/", label: "Hoy", icon: MapPin },
  { href: "/history", label: "Histórico", icon: Compass },
  { href: "/routes", label: "Rutas", icon: Route },
  { href: "/patterns", label: "Patrones", icon: ChartLine },
] as const;

interface Props { current: string; lastUpdated?: string; }

export function Sidebar({ current, lastUpdated }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={cn("fixed left-0 top-0 h-dvh flex flex-col border-r border-border bg-surface-elevated transition-all", collapsed ? "w-16" : "w-64")}>
      <div className="p-4 font-display text-sm text-fg-muted tracking-wide">
        {collapsed ? "MP" : "Machu Picchu Ticket Log"}
      </div>
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {sections.map(({ href, label, icon: Icon }) => (
          <a key={href} href={href} className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-mono transition-colors",
            current === href ? "bg-surface text-accent" : "text-fg-muted hover:text-fg hover:bg-surface")}>
            <Icon size={16} />
            {!collapsed && <span>{label}</span>}
          </a>
        ))}
      </nav>
      <div className="p-4 border-t border-border text-xs text-fg-subtle font-mono">
        {!collapsed && (
          <>
            <a href="https://github.com/jovandyaz/machupicchu-ticket-tracker" className="flex items-center gap-1 hover:text-fg">
              repo <ExternalLink size={10} />
            </a>
            {lastUpdated && <div className="mt-2">updated {lastUpdated}</div>}
          </>
        )}
      </div>
    </aside>
  );
}
```

**Step 2:** Update `Base.astro` to render sidebar + main content area with left margin `md:ml-64`.

**Step 3:** Run `pnpm dev` → verify sidebar renders, click each link (currently 404 on most, OK).

**Step 4:** Commit:
```bash
git add web/src/components/islands/Sidebar.tsx web/src/layouts/Base.astro
git commit -m "feat(web): add sidebar navigation island"
```

---

### Task 2.3: Add TanStack Query provider + shared fetcher

**Files:**
- Create: `web/src/components/islands/QueryProvider.tsx`
- Create: `web/src/lib/data/fetch-today.ts`

**Step 1:** Create `QueryProvider.tsx`:
```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

export function QueryProvider({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

**Step 2:** Create `fetch-today.ts`:
```ts
import { parseJsonl } from "@/../scripts/build-data";
import type { Reading } from "@types/record";

const REPO = "jovandyaz/machupicchu-ticket-tracker";

export function buildTodayUrl(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `https://raw.githubusercontent.com/${REPO}/main/data/${y}/${m}/${y}-${m}-${d}.jsonl`;
}

export async function fetchToday(date: Date): Promise<Reading[]> {
  const res = await fetch(buildTodayUrl(date), { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return parseJsonl(await res.text());
}

export function getPeruDate(): Date {
  const now = new Date();
  return new Date(now.getTime() - 5 * 60 * 60 * 1000);
}

export function getPeruHour(): number {
  return getPeruDate().getUTCHours();
}
```

**Step 3:** Commit:
```bash
git add web/src/components/islands/QueryProvider.tsx web/src/lib/data/fetch-today.ts
git commit -m "feat(web): add tanstack query provider and today fetcher"
```

---

## Phase 3 — Views

### Task 3.1: `<TodayLiveStats>` island + `index.astro`

**Files:**
- Create: `web/src/components/islands/TodayLiveStats.tsx`
- Modify: `web/src/pages/index.astro`

**Step 1:** Build island:
```tsx
import { useQuery } from "@tanstack/react-query";
import { fetchToday, getPeruDate, getPeruHour } from "@/lib/data/fetch-today";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function TodayLiveStats() {
  const today = getPeruDate();
  const query = useQuery({
    queryKey: ["today", today.toISOString().slice(0, 10)],
    queryFn: () => fetchToday(today),
    refetchInterval: (q) => {
      const hour = getPeruHour();
      if (hour >= 22 || hour < 5) return false;
      const last = q.state.data?.at(-1);
      if (last?.total_available === 0) return false;
      return 60_000;
    },
  });

  if (query.isLoading) return <Card><CardContent>Loading...</CardContent></Card>;
  if (query.isError) return <Card><CardContent>Error loading today</CardContent></Card>;
  const last = query.data?.at(-1);
  if (!last) return <Card><CardContent>No data yet today</CardContent></Card>;

  const pct = (last.total_sold / last.total_capacity) * 100;
  const status = last.total_available === 0 ? "sold-out" : pct > 80 ? "critical" : "available";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-4xl">
          {last.total_sold.toLocaleString()} / {last.total_capacity.toLocaleString()}
        </CardTitle>
        <Badge variant={status === "available" ? "default" : "destructive"}>{status}</Badge>
      </CardHeader>
      <CardContent>
        <Progress value={pct} />
        <p className="text-xs font-mono text-fg-muted mt-2">updated {last.time} PET</p>
      </CardContent>
    </Card>
  );
}
```

**Step 2:** Update `index.astro`:
```astro
---
import Base from "@layouts/Base.astro";
import { Sidebar } from "@components/islands/Sidebar";
import { QueryProvider } from "@components/islands/QueryProvider";
import { TodayLiveStats } from "@components/islands/TodayLiveStats";
---
<Base title="Hoy — Machu Picchu">
  <Sidebar client:load current="/" />
  <main class="md:ml-64 p-8">
    <QueryProvider client:load>
      <TodayLiveStats client:load />
    </QueryProvider>
  </main>
</Base>
```

**Step 3:** Run `pnpm dev` → verify KPI card renders with live polling.

**Step 4:** Commit:
```bash
git add web/src/components/islands/TodayLiveStats.tsx web/src/pages/index.astro
git commit -m "feat(web): add today live stats with tanstack polling"
```

---

### Task 3.2: `<RouteAvailabilityGrid>` + `<SalesVelocityChart>`

**Files:**
- Create: `web/src/components/islands/RouteAvailabilityGrid.tsx`
- Create: `web/src/components/islands/SalesVelocityChart.tsx`
- Modify: `web/src/pages/index.astro`

**Step 1:** Build `RouteAvailabilityGrid` — 6 cards sorted by % occupancy desc, each showing route name, circuit, progress bar, sold/capacity.

**Step 2:** Build `SalesVelocityChart` using shadcn `ChartContainer` + Recharts `AreaChart` with x-axis = time (HH:MM), y-axis = cumulative `total_sold`.

**Step 3:** Compose into `index.astro` below `TodayLiveStats`.

**Step 4:** Commit:
```bash
git add web/src/components/islands/
git commit -m "feat(web): add route grid and velocity chart on today view"
```

---

### Task 3.3: `<SoldOutProjection>` island

**Files:**
- Create: `web/src/components/islands/SoldOutProjection.tsx`
- Create: `web/src/lib/utils/projection.ts`
- Create: `web/src/lib/utils/projection.test.ts`

**Step 1:** TDD the projection math — linear regression on last N readings, solve for when `total_sold = total_capacity`.

**Step 2:** Implement + test.

**Step 3:** Wire into `index.astro`.

**Step 4:** Commit:
```bash
git add web/src/components/islands/SoldOutProjection.tsx web/src/lib/utils/
git commit -m "feat(web): add sold-out projection with linear regression"
```

---

### Task 3.4: `history.astro` with calendar heatmap

**Files:**
- Create: `web/src/pages/history.astro`
- Create: `web/src/components/islands/HistoryHeatmap.tsx`

**Step 1:** Astro page fetches `/data/daily-index.json` at build time and passes to React island.

**Step 2:** React island renders a grid: weeks as rows, days as cells, background color based on `total_sold / total_capacity`.

**Step 3:** Add date-range filter + paginated table below.

**Step 4:** Commit:
```bash
git add web/src/pages/history.astro web/src/components/islands/HistoryHeatmap.tsx
git commit -m "feat(web): add history page with calendar heatmap"
```

---

### Task 3.5: `routes.astro` — comparative all-routes view

**Files:**
- Create: `web/src/pages/routes.astro`
- Create: `web/src/components/islands/RoutesComparison.tsx`

**Step 1:** Load all 6 `routes/*.json` at build time.

**Step 2:** Render 6 KPI cards + a comparative line chart (% occupancy over last 30 days per route).

**Step 3:** Sortable ranking table.

**Step 4:** Commit.

---

### Task 3.6: `patterns.astro` — demand patterns

**Files:**
- Create: `web/src/pages/patterns.astro`
- Create: `web/src/components/islands/PatternsInsights.tsx`

**Step 1:** Load `patterns.json` at build time.

**Step 2:** Render bar chart (by hour), radar chart (by weekday), heatmap (by month), and 3 insight cards derived from the data.

**Step 3:** Commit.

---

## Phase 4 — CI/CD + polish

### Task 4.1: GitHub Actions workflow for deploy

**Files:**
- Create: `.github/workflows/deploy-web.yml`
- Modify: `web/astro.config.ts` (set `site` and `base` if needed)

**Step 1:** Write workflow per design doc.

**Step 2:** Enable GitHub Pages in repo settings: Source = "GitHub Actions".

**Step 3:** Push to `main` → verify deploy succeeds and site is live.

**Step 4:** Commit:
```bash
git add .github/workflows/deploy-web.yml web/astro.config.ts
git commit -m "ci: add deploy-web workflow for github pages"
```

---

### Task 4.2: Add motion + visual polish (staggered reveal, counters)

**Files:**
- Modify: view components to add Motion `initial`/`animate` with staggered delays.

**Step 1:** Add staggered page-load animations (hero 0ms, KPIs 200ms, charts 400ms).

**Step 2:** Animate number counters in `TodayLiveStats` (0 → value over 1.2s).

**Step 3:** Add live-indicator pulse on the polling badge.

**Step 4:** Commit.

---

### Task 4.3: README update — link to dashboard

**Files:**
- Modify: `README.md`

**Step 1:** Add a top banner linking to the live dashboard URL.

**Step 2:** Add a "Dashboard" section with screenshot once deployed.

**Step 3:** Commit.

---

### Task 4.4: Final verification

**Step 1:** Run `cd web && pnpm check && pnpm test && pnpm build` locally.

**Step 2:** Run Lighthouse on the deployed URL. Verify ≥95 on Performance, Accessibility, Best Practices.

**Step 3:** Manually walk through all 4 views on desktop + mobile viewports.

**Step 4:** Verify live polling updates the `TodayLiveStats` in real time.

---

## Notes

- **Frequent commits:** each task ends with a commit. Do not batch tasks.
- **TDD where it matters:** all aggregation logic in `build-data.ts` is tested. UI components are visually verified, not unit-tested (YAGNI for MVP).
- **Don't skip verification:** run `pnpm check` and the vitest suite before every commit in Phase 1.
- **Base path:** if GitHub Pages serves under `/machupicchu-ticket-tracker/`, set `base` in `astro.config.ts` and adjust `<Sidebar>` links accordingly.
