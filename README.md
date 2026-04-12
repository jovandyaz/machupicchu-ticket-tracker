# Machu Picchu Ticket Tracker

Monitoreo automatizado de la disponibilidad de boletos de Machu Picchu (1,000 boletos diarios vendidos en el Centro Cultural de Aguas Calientes).

## Datos recolectados

Cada 10 minutos, un GitHub Action consulta la API de [tuboleto.cultura.pe](https://tuboleto.cultura.pe/cusco/1000boletos) y registra:

- **Boletos vendidos del día** (total)
- **Disponibilidad por ruta** (aforo, vendidos, disponibles):
  - Ruta 1-A: Montaña Machupicchu (50 cupos)
  - Ruta 1-B: Terraza Superior (100 cupos)
  - Ruta 2-A: Clásico Diseñada (600 cupos)
  - Ruta 2-B: Terraza Inferior (100 cupos)
  - Ruta 3-A: Montaña Waynapicchu (50 cupos)
  - Ruta 3-B: Realeza Diseñada (100 cupos)

## Estructura de datos

```
data/
├── daily-totals/          # Totales diarios históricos (backfill)
│   ├── 2025-04.jsonl
│   └── ...
├── 2026/
│   └── 04/
│       ├── 2026-04-12.jsonl   # Lecturas cada 10 min con desglose por ruta
│       └── ...
```

Cada línea en un `.jsonl` es un registro JSON con esta estructura:

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

1. Configurar el secret `TUBOLETO_SECRET_KEY` en el repo
2. El GitHub Action corre automáticamente cada 10 minutos

## Scripts

- `scripts/fetch-availability.js` - Consulta la API y guarda datos (ejecutado por GitHub Actions)
- `scripts/backfill-daily-totals.sh` - Rellena totales históricos para un rango de fechas

## Backfill de datos históricos

```bash
./scripts/backfill-daily-totals.sh 2025-04-01 2026-04-12
```
