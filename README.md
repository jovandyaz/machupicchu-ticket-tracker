# Machu Picchu Ticket Tracker

Automated monitoring of Machu Picchu ticket availability — the 1,000 daily tickets sold at the Aguas Calientes Cultural Center.

## Routes

| Route | Circuit | Capacity |
|-------|---------|----------|
| 1-A: Montana Machupicchu | Circuito 1 - Panoramico | 50 |
| 1-B: Terraza Superior | Circuito 1 - Panoramico | 100 |
| 2-A: Clasico Disenada | Circuito 2 - Clasico | 600 |
| 2-B: Terraza Inferior | Circuito 2 - Clasico | 100 |
| 3-A: Montana Waynapicchu | Circuito 3 - Realeza | 50 |
| 3-B: Realeza Disenada | Circuito 3 - Realeza | 100 |

## Log

### 2026-04-12 — First day of tracking (target: Apr 13)

Sales started around **6:00 AM Peru time**. By 12:30 PM, 279 out of 1,000 tickets were sold (28%).

| Time (PET) | Sold today | Sold tomorrow | Available |
|------------|-----------|---------------|-----------|
| 02:49 | 0 | 0 | 1,000 |
| 06:13 | 45 | 11 | 989 |
| 07:01 | 65 | 58 | 942 |
| 08:44 | 145 | 134 | 866 |
| 10:02 | 194 | 179 | 821 |
| 11:00 | 234 | 227 | 773 |
| 12:30 | 291 | 279 | 721 |

**Route breakdown at 12:30 PM:**

| Route | Sold | Capacity | % |
|-------|------|----------|---|
| 2-A: Clasico Disenada | 228 | 600 | 38% |
| 2-B: Terraza Inferior | 34 | 100 | 34% |
| 3-A: Montana Waynapicchu | 9 | 50 | 18% |
| 3-B: Realeza Disenada | 4 | 100 | 4% |
| 1-B: Terraza Superior | 3 | 100 | 3% |
| 1-A: Montana Machupicchu | 1 | 50 | 2% |

**Early observations:**
- Route 2-A (Clasico) dominates demand — 82% of all sales
- Sales velocity: ~40 tickets/hour in the morning
- Mountain routes (1-A, 3-A) sell slowly compared to classic circuit

## How It Works

A GitHub Action runs every 10 minutes (5 AM — 11 PM Peru time) and queries the [tuboleto.cultura.pe](https://tuboleto.cultura.pe/cusco/1000boletos) API to record:

- **Tickets sold today** (total counter)
- **Availability per route** (capacity, sold, available) for the next day

## Data Structure

```
data/
├── daily-totals/          # Historical daily totals (backfill)
│   ├── 2025-04.jsonl
│   └── ...
├── 2026/
│   └── 04/
│       ├── 2026-04-12.jsonl   # Readings every 10 min with per-route breakdown
│       └── ...
```

Each line in a `.jsonl` file:

```json
{
  "timestamp": "2026-04-12T08:30:00",
  "date": "2026-04-12",
  "time": "08:30:00",
  "target_date": "2026-04-13",
  "tickets_sold_today": 450,
  "total_capacity": 1000,
  "total_sold": 320,
  "total_available": 680,
  "routes": [
    {
      "route": "Ruta 1-A: Montana Machupicchu",
      "circuit": "Circuito 1 - Panoramico",
      "capacity": 50,
      "available": 30,
      "sold": 20
    }
  ]
}
```

## Setup

1. Set the `TUBOLETO_SECRET_KEY` secret in the repo
2. The GitHub Action runs automatically every 10 minutes

## Scripts

- `scripts/fetch-availability.js` — Queries the API and saves data (run by GitHub Actions)
- `scripts/backfill-daily-totals.sh` — Backfills historical daily totals for a date range

```bash
./scripts/backfill-daily-totals.sh 2025-04-01 2026-04-12
```
