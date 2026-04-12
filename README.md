# Machu Picchu Ticket Tracker

Automated monitoring of Machu Picchu ticket availability (1,000 daily tickets sold at the Aguas Calientes Cultural Center).

## Collected Data

Every 10 minutes, a GitHub Action queries the [tuboleto.cultura.pe](https://tuboleto.cultura.pe/cusco/1000boletos) API and records:

- **Tickets sold today** (total)
- **Availability per route** (capacity, sold, available):
  - Ruta 1-A: Montaña Machupicchu (50 slots)
  - Ruta 1-B: Terraza Superior (100 slots)
  - Ruta 2-A: Clásico Diseñada (600 slots)
  - Ruta 2-B: Terraza Inferior (100 slots)
  - Ruta 3-A: Montaña Waynapicchu (50 slots)
  - Ruta 3-B: Realeza Diseñada (100 slots)

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

Each line in a `.jsonl` file is a JSON record with this structure:

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
      "route": "Ruta 1-A: Montaña Machupicchu",
      "circuit": "Circuito 1 - Panorámico",
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

- `scripts/fetch-availability.js` - Queries the API and saves data (run by GitHub Actions)
- `scripts/backfill-daily-totals.sh` - Backfills historical daily totals for a date range

## Backfill Historical Data

```bash
./scripts/backfill-daily-totals.sh 2025-04-01 2026-04-12
```
