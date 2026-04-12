import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import type { Patterns } from "@/lib/types/aggregates";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CARD_HOVER } from "@/lib/styles";
import { allZero, shortWeekday } from "@/lib/utils/aggregations";

const weekdayChartConfig = {
  sold: {
    label: "Vendidos",
    color: "var(--color-accent-electric)",
  },
} satisfies ChartConfig;

interface PatternsWeekdayRadarProps {
  patterns: Patterns;
}

export function PatternsWeekdayRadar({ patterns }: PatternsWeekdayRadarProps) {
  const weekdaysHaveData = !allZero(patterns.by_weekday);

  const weekdayData = useMemo(
    () =>
      patterns.by_weekday.map((sold, idx) => ({
        day: shortWeekday(idx),
        sold,
      })),
    [patterns.by_weekday],
  );

  return (
    <Card className={CARD_HOVER}>
      <CardContent>
        {weekdaysHaveData ? (
          <ChartContainer
            config={weekdayChartConfig}
            className="mx-auto h-72 w-full max-w-md"
          >
            <RadarChart data={weekdayData}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis
                dataKey="day"
                stroke="var(--color-fg-muted)"
                fontFamily="var(--font-mono)"
                fontSize={11}
              />
              <PolarRadiusAxis
                stroke="var(--color-fg-subtle)"
                fontFamily="var(--font-mono)"
                fontSize={9}
                tickCount={4}
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <Radar
                dataKey="sold"
                stroke="var(--color-accent-electric)"
                fill="var(--color-accent-electric)"
                fillOpacity={0.3}
                strokeWidth={1.5}
                dot={{ r: 3, fill: "var(--color-accent-electric)" }}
              />
            </RadarChart>
          </ChartContainer>
        ) : (
          <p className="font-sans text-sm text-fg-muted">
            Sin datos por día de la semana todavía.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
