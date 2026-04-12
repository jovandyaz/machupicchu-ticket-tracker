import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  type RectangleProps,
  XAxis,
  YAxis,
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
import { allZero, argmaxNonZero } from "@/lib/utils/aggregations";

const hourChartConfig = {
  delta: {
    label: "Ventas",
    color: "var(--color-accent)",
  },
} satisfies ChartConfig;

interface HourDatum {
  hour: string;
  delta: number;
  isPeak: boolean;
}

type HourBarProps = RectangleProps & { payload?: HourDatum };

function HourBar(props: HourBarProps) {
  const fill = props.payload?.isPeak
    ? "var(--color-accent)"
    : "var(--color-fg-subtle)";
  return <Rectangle {...props} fill={fill} />;
}

interface PatternsHourChartProps {
  patterns: Patterns;
}

export function PatternsHourChart({ patterns }: PatternsHourChartProps) {
  const hoursHaveData = !allZero(patterns.by_hour);
  const peakHour = argmaxNonZero(patterns.by_hour);

  const hourData = useMemo<HourDatum[]>(
    () =>
      patterns.by_hour.map((delta, hour) => ({
        hour: hour.toString().padStart(2, "0"),
        delta,
        isPeak: hour === peakHour,
      })),
    [patterns.by_hour, peakHour],
  );

  return (
    <Card className={CARD_HOVER}>
      <CardContent>
        {hoursHaveData ? (
          <ChartContainer config={hourChartConfig} className="h-64 w-full">
            <BarChart
              accessibilityLayer
              data={hourData}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="2 4"
                stroke="var(--color-border)"
                strokeOpacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                stroke="var(--color-fg-muted)"
                fontFamily="var(--font-mono)"
                fontSize={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                stroke="var(--color-fg-muted)"
                fontFamily="var(--font-mono)"
                fontSize={10}
                width={36}
              />
              <ChartTooltip
                cursor={{ fill: "var(--color-surface-elevated)" }}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar
                dataKey="delta"
                radius={[2, 2, 0, 0]}
                isAnimationActive
                animationDuration={800}
                shape={HourBar}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="font-sans text-sm text-fg-muted">
            Sin datos de intensidad horaria todavía.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
