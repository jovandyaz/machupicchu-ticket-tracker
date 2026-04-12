import { motion } from "motion/react";
import type { Patterns } from "@/lib/types/aggregates";
import { Card, CardContent } from "@/components/ui/card";
import { CARD_HOVER } from "@/lib/styles";
import { allZero } from "@/lib/utils/aggregations";
import { useFadeIn } from "@/lib/utils/motion";
import { PatternsHourChart } from "./patterns/PatternsHourChart";
import { PatternsInsightCards } from "./patterns/PatternsInsightCards";
import { PatternsMonthGrid } from "./patterns/PatternsMonthGrid";
import { PatternsWeekdayRadar } from "./patterns/PatternsWeekdayRadar";

interface PatternsInsightsProps {
  patterns: Patterns;
}

export function PatternsInsights({ patterns }: PatternsInsightsProps) {
  const insufficientData =
    allZero(patterns.by_hour) &&
    allZero(patterns.by_weekday) &&
    Object.keys(patterns.by_month).length === 0;

  const fade = useFadeIn();

  return (
    <div className="space-y-8">
      <motion.section
        {...fade(0)}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
        aria-labelledby="patterns-insights-heading"
      >
        <PatternsInsightCards patterns={patterns} />
      </motion.section>

      {insufficientData && (
        <Card className={CARD_HOVER}>
          <CardContent>
            <p className="font-display text-xl text-fg">
              Solo llevamos 1 día de tracking
            </p>
            <p className="mt-1 font-sans text-sm text-fg-muted">
              Esta vista tendrá más historia pronto — los patrones son más
              expresivos con varias semanas acumuladas.
            </p>
          </CardContent>
        </Card>
      )}

      <motion.section
        {...fade(0.1)}
        className="space-y-3"
        aria-labelledby="patterns-hour-heading"
      >
        <h2
          id="patterns-hour-heading"
          className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase"
        >
          Ventas por hora del día
        </h2>
        <PatternsHourChart patterns={patterns} />
      </motion.section>

      <motion.section
        {...fade(0.2)}
        className="space-y-3"
        aria-labelledby="patterns-weekday-heading"
      >
        <h2
          id="patterns-weekday-heading"
          className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase"
        >
          Demanda por día de la semana
        </h2>
        <PatternsWeekdayRadar patterns={patterns} />
      </motion.section>

      <motion.section
        {...fade(0.3)}
        className="space-y-3"
        aria-labelledby="patterns-month-heading"
      >
        <h2
          id="patterns-month-heading"
          className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase"
        >
          Ocupación promedio por mes
        </h2>
        <PatternsMonthGrid patterns={patterns} />
      </motion.section>
    </div>
  );
}
