import type { Patterns } from "@/lib/types/aggregates";
import { Card, CardContent } from "@/components/ui/card";
import {
  argmaxNonZero,
  topMonth,
  weekdayLabel,
} from "@/lib/utils/aggregations";

interface InsightCardProps {
  label: string;
  value: string;
  detail: string;
}

function InsightCard({ label, value, detail }: InsightCardProps) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
          {label}
        </p>
        <p className="font-display text-3xl text-fg tabular-nums">{value}</p>
        <p className="font-sans text-xs text-fg-muted">{detail}</p>
      </CardContent>
    </Card>
  );
}

interface PatternsInsightCardsProps {
  patterns: Patterns;
}

export function PatternsInsightCards({ patterns }: PatternsInsightCardsProps) {
  const peakHour = argmaxNonZero(patterns.by_hour);
  const peakWeekday = argmaxNonZero(patterns.by_weekday);
  const topMonthValue = topMonth(patterns.by_month);

  const peakHourLabel =
    peakHour >= 0 ? `${peakHour.toString().padStart(2, "0")}:00` : "—";

  return (
    <>
      <InsightCard
        label="Hora pico"
        value={peakHourLabel}
        detail={
          peakHour >= 0
            ? `El ritmo de ventas es más intenso alrededor de las ${peakHourLabel}.`
            : "Sin suficientes datos para detectar hora pico."
        }
      />
      <InsightCard
        label="Día con más ventas"
        value={peakWeekday >= 0 ? weekdayLabel(peakWeekday) : "—"}
        detail={
          peakWeekday >= 0
            ? `${weekdayLabel(peakWeekday)} concentra la mayor demanda promedio.`
            : "Aún no hay diferencias significativas entre días."
        }
      />
      <InsightCard
        label="Ocupación del mes"
        value={
          topMonthValue
            ? `${Math.round(topMonthValue.occupancy * 100)}%`
            : "—"
        }
        detail={
          topMonthValue
            ? `El mes con mayor demanda es ${topMonthValue.month} con ${Math.round(
                topMonthValue.occupancy * 100,
              )}% de ocupación promedio.`
            : "Acumularemos más meses para detectar temporada."
        }
      />
    </>
  );
}
