# Astro Dashboard Design — Machu Picchu Ticket Tracker

**Date:** 2026-04-12
**Status:** Approved, ready for implementation
**Related:** Extends the existing `machupicchu-ticket-tracker` repo with a public web dashboard for visualizing the collected ticket availability data.

---

## Goals

Deploy a public, low-maintenance dashboard that surfaces the data collected by the existing GitHub Actions tracker. It must:

- Feel "real-time" without requiring a backend.
- Run entirely on GitHub Pages (no paid services, no external infra).
- Be robust and structured so the repo can migrate to a pnpm workspace layout without refactoring.
- Differentiate visually from generic dashboards through a deliberate aesthetic.

## Non-goals (MVP)

- No authentication, no user accounts, no write operations.
- No SSR, no databases (all data is static files + client-side polling).
- No E2E tests for MVP (added later once the site is stable).
- No component-level visual testing (Storybook, etc.).

---

## Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | **Astro 5** (`output: 'static'`) | Content-driven, minimal JS by default, island architecture |
| Islands runtime | **React 18** | User familiarity, ecosystem size, best chart library support |
| Styling | **Tailwind CSS v4** (CSS-first config) | Standard for React + Astro, fast iteration |
| Components / charts | **shadcn/ui Chart + Recharts v3** | LLM-friendly copy-paste pattern, ecosystem trend 2024–2026 |
| Client data fetching | **TanStack Query (React Query)** | SWR pattern, conditional polling, retries, window-focus revalidation |
| Runtime validation | **Zod** | Defensive parsing of JSONL entries |
| Motion | **Motion** (React) + CSS where possible | One well-orchestrated page load > scattered micro-interactions |
| Icons | **lucide-react** | Well-aligned with shadcn/ui, customizable |
| Testing | **Vitest** (build-data pipeline only) | YAGNI for UI tests in MVP |
| Package manager | **pnpm** | Aligned with user preference, ready for workspace migration |
| Hosting | **GitHub Pages** | No external services, free, same repo |

---

## Architecture

### High-level flow

```
┌──────────────────────────────────────────────┐
│  Existing: track-availability.yml (every 10m) │
│  → commits JSONL files to data/               │
└──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│  New: deploy-web.yml (on web/ push + daily)  │
│  1. build-data.ts: JSONL → aggregated JSONs   │
│  2. astro build: static site                  │
│  3. deploy to GitHub Pages                    │
└──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│  Browser: Astro static HTML + React islands  │
│                                              │
│  • Historical views → consume pre-computed    │
│    JSONs from /data/ (cached by CDN)         │
│                                              │
│  • "Today" view → TanStack Query polls       │
│    raw.githubusercontent.com/.../today.jsonl │
│    every 60s with conditional refetch        │
└──────────────────────────────────────────────┘
```

### Folder structure (ready for pnpm workspace migration)

```
machupicchu-ticket-tracker/
├── data/                          # existing JSONL files
├── scripts/                       # existing data fetcher
│   ├── fetch-availability.js
│   └── backfill-daily-totals.sh
├── web/                           # NEW — Astro site
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.astro        # view A: Today
│   │   │   ├── history.astro      # view B: History
│   │   │   ├── routes.astro       # view C: All routes (single comparative view)
│   │   │   └── patterns.astro     # view D: Demand patterns
│   │   ├── components/
│   │   │   ├── charts/            # shadcn chart primitives
│   │   │   ├── islands/           # React interactive components
│   │   │   └── ui/                # shadcn primitives (Card, Badge, etc.)
│   │   ├── layouts/
│   │   │   └── Base.astro         # sidebar + main content
│   │   ├── lib/
│   │   │   ├── data/              # loaders + preprocessors
│   │   │   ├── types/             # TS types (future @packages/types)
│   │   │   └── utils/
│   │   └── styles/
│   │       └── globals.css        # Tailwind v4 @theme + design tokens
│   ├── scripts/
│   │   └── build-data.ts          # preprocesses JSONL → aggregated JSONs
│   ├── public/
│   │   └── data/                  # generated JSONs (served statically)
│   ├── astro.config.ts
│   ├── tsconfig.json              # strict mode + path aliases
│   ├── package.json
│   └── vitest.config.ts
├── .github/workflows/
│   ├── track-availability.yml     # existing
│   └── deploy-web.yml             # NEW
├── docs/
│   └── plans/
│       └── 2026-04-12-astro-dashboard-design.md
└── README.md
```

When migrating to workspace later:
- `web/src/lib/types/` → `packages/types/`
- `web/` → `apps/web/`
- `scripts/` → `packages/data-tracker/`

No other changes needed.

---

## Data pipeline

### Build-time: aggregated JSONs

Script at `web/scripts/build-data.ts` runs before `astro build`. Reads `../data/**/*.jsonl` and outputs optimized JSONs to `web/public/data/`:

```
web/public/data/
├── daily-index.json        # array: { date, sold_out_time?, total_sold, peak_hour }
├── history/
│   └── YYYY-MM.json        # all days in a month with aggregated metrics
├── routes/
│   ├── ruta-1a.json        # historical data per route + stats
│   └── ... (6 files)
└── patterns.json           # global aggregates: peak hour, weekday demand, seasonality
```

Why pre-compute: reading 365 JSONLs with ~100 lines each on the client would be ~36K lines of parsing. Pre-computed JSONs are ~5KB per view.

### Client-side: today's live data

Island `<TodayLiveStats />` in `index.astro`:

```ts
useQuery({
  queryKey: ['today', yyyy_mm_dd],
  queryFn: () => fetch(RAW_GITHUB_URL).then(r => r.text()).then(parseJsonl),
  refetchInterval: (query) => {
    const peruHour = getPeruHour();
    if (peruHour >= 22 || peruHour < 5) return false;  // outside ticket office hours
    if (query.state.data?.total_available === 0) return false;  // sold out
    return 60_000;
  },
  staleTime: 30_000,
  gcTime: 5 * 60_000,
  refetchOnWindowFocus: true,
});
```

### Type contracts

`web/src/lib/types/record.ts` — source of truth for the JSONL shape, validated at parse time with Zod schemas. Must stay in sync with `scripts/fetch-availability.js`. When the project migrates to a workspace, this file moves to `packages/types/` and both sides import from it.

---

## Views

### A — `index.astro` "Today"

- Hero: `X / 1,000 vendidos` number with progress bar, status badge, "updated Xs ago".
- `<TodayLiveStats />` island (TanStack Query, 60s polling).
- `<RouteAvailabilityGrid />`: cards per route, sorted by % occupancy desc.
- `<SalesVelocityChart />`: shadcn area chart of cumulative sales by hour.
- `<SoldOutProjection />`: "at this pace, sold out by HH:MM" (simple linear regression).

### B — `history.astro` "History"

- Calendar heatmap (GitHub contributions style): color by % sold.
- Filters: date range, "sold-out only", season.
- Paginated table: date, sold-out time, total sold, top-demand route.

### C — `routes.astro` "All routes"

Single comparative view showing all 6 routes side-by-side:
- KPI cards per route: average % occupancy, sold-out frequency, average velocity.
- Comparative line chart: % occupancy over last N days per route.
- Ranking table with sortable columns.

### D — `patterns.astro` "Demand patterns"

- Peak sales hour (bar chart, historical average by hour of day).
- Weekday demand (radar chart Mon–Sun).
- Seasonality (heatmap month × day).
- Highlighted insight cards: "Tuesdays have the most availability", "July is the most critical month", etc.

### Navigation — sidebar

- 240–280px width, collapsible to icon-only mini-drawer on tablet/mobile.
- Top: small "Machu Picchu Ticket Log" text title (no logo).
- Middle: nav sections with small map-marker icons (pin, compass, path glyphs).
- Footer: legend (color + status), GitHub repo link, "last updated" timestamp.

---

## Visual identity — Retrofuturist Inca cartography

### Typography

- **Display**: Fraunces (variable, expressive) — view titles, hero numbers, section labels.
- **Body**: Instrument Sans (neogrotesque with character).
- **Mono / data**: JetBrains Mono — timestamps, percentages, tables, route IDs.
- **Accent italic**: Cormorant Garamond — epigraphs ("Field log entry #001").

### Color tokens (dark-first)

```css
--bg: #1a1714;                /* warm black, not pure */
--surface: #221e1a;
--surface-elevated: #2b2620;
--border: #3a3229;            /* topographic lines */
--fg: #e8ddc7;                /* light sepia */
--fg-muted: #9b8f7a;
--fg-subtle: #5a5043;
--accent: #d4a537;            /* Inca gold / sun */
--accent-electric: #2dd4bf;   /* live data indicator */
--success: #7a9b5f;
--warning: #c97c2c;
--danger: #a63d2a;
```

Light theme is a derivation (parchment background `#f2ead9`, dark sepia text). Declared as `@theme` tokens in Tailwind v4.

### Motifs

- Subtle grain/noise overlay for a paper-parchment feel.
- Stepped borders on key cards (Inca masonry inspiration, not uniform border-radius).
- Stepped-line decorative dividers between sections.
- Coordinate markers ("13°09'48\"S") as decorative header elements.
- Subtle topographic-paper grid background on data views.

### Motion

- Staggered page load reveals (hero → KPIs → charts), 200ms steps.
- Number counters animate 0 → value (easeOutQuart, ~1.2s).
- Chart lines draw left-to-right on viewport entry.
- Hover: card lift + accent border highlight.
- Live indicator: soft radar-sweep pulse on the polling dot.

---

## CI/CD

### Workflow `deploy-web.yml`

```yaml
on:
  push:
    branches: [main]
    paths: ['web/**', '.github/workflows/deploy-web.yml']
  schedule:
    - cron: '0 5 * * *'      # daily refresh of historical aggregates
  workflow_dispatch:

concurrency:
  group: 'pages'
  cancel-in-progress: false
```

Jobs: `build` (install, build-data, astro build) → `deploy` (pages artifact).

### Does this affect the existing tracker?

No. The tracker commits to `main`, the deploy workflow only reads and publishes to Pages. The tracker already rebases before push, so there is no concurrency concern. Today's data freshness is handled by client-side polling, not by rebuild frequency.

---

## TypeScript + quality tooling

- `web/tsconfig.json` extends `astro/tsconfigs/strict`.
- Path aliases: `@/*`, `@components/*`, `@lib/*`, `@types/*`.
- Flags: `verbatimModuleSyntax`, `noUncheckedIndexedAccess`.
- Prettier + `prettier-plugin-astro` + `prettier-plugin-tailwindcss`.
- ESLint with Astro's official config + `eslint-plugin-react-hooks`.
- Pre-commit via `simple-git-hooks` + `lint-staged`.

## Testing

**In scope (MVP):**
- Vitest unit tests for `build-data.ts` aggregation functions (parseJsonl, computeDailySummary, detectSoldOutTime, computeHourlyPattern).
- Zod schema parsing ensures malformed JSONL is caught at build time.

**Out of scope (MVP):**
- UI component tests, Storybook, Playwright E2E.

## Performance budgets

- LCP < 1.5s on simulated 3G.
- Total JS < 100KB gzipped (Astro islands hydrate only what's needed).
- Lighthouse ≥ 95 on Performance / Accessibility / Best Practices.

---

## Future work (not MVP)

- Migrate to pnpm workspace when a second consumer needs the shared types.
- Add Playwright E2E for critical user flows once production-stable.
- Add localStorage persistence for TanStack Query cache (instant cold loads).
- Consider migration to Cloudflare Pages + Astro 6 Live Collections if runtime data becomes necessary.
- Add `/api/` style JSON explorer endpoint for third-party consumers.

---

## Open questions resolved

- **Monorepo vs separate repo?** Monorepo (option A) with structure ready for workspace migration.
- **SQLite?** No. Pre-computed JSONs from JSONL cover the same querying needs without external dependencies.
- **ISR / Astro 6 Live Collections?** Deferred. Hybrid static + client-side polling with TanStack Query is sufficient and compatible with GitHub Pages.
- **Sidebar vs navbar?** Sidebar (matches dashboard conventions in 2026, scales to more sections).
- **Routes as dynamic pages or single comparative view?** Single comparative view — better for analysis, fewer generated pages.
