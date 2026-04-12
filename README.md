# Machu Picchu Ticket Tracker

Automated monitoring of Machu Picchu ticket availability — the 1,000 daily tickets sold at the Aguas Calientes Cultural Center.

## Context

Since April 2025, Machu Picchu tickets are **only sold in person** at the Centro Cultural de Aguas Calientes. No online purchases. The government issues 1,000 tickets per day, split across 6 routes in 3 circuits.

The ticket office operates daily from **3:00 PM to 10:00 PM** (Peru time, UTC-5), selling tickets for the **next day** only. Tickets often sell out — especially during high season (June–August) and holidays.

## Routes

| Route | Circuit | Capacity | Description |
|-------|---------|----------|-------------|
| 1-A: Montana Machupicchu | Circuito 1 - Panoramico | 50 | Hike to Montana Machupicchu summit |
| 1-B: Terraza Superior | Circuito 1 - Panoramico | 100 | Upper terrace panoramic views |
| 2-A: Clasico Disenada | Circuito 2 - Clasico | 600 | Classic route — most popular |
| 2-B: Terraza Inferior | Circuito 2 - Clasico | 100 | Lower terrace circuit |
| 3-A: Montana Waynapicchu | Circuito 3 - Realeza | 50 | Hike to Waynapicchu peak |
| 3-B: Realeza Disenada | Circuito 3 - Realeza | 100 | Royalty circuit design route |

**Total daily capacity: 1,000 tickets**

## How It Works

A GitHub Action runs every 10 minutes (5 AM — 11 PM Peru time) and queries the [tuboleto.cultura.pe](https://tuboleto.cultura.pe/cusco/1000boletos) API to record:

- **Tickets sold today** (total counter at ticket office)
- **Availability per route** for the next day (capacity, sold, available)

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
