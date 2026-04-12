import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import type { RouteStats } from "@/lib/types/aggregates";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CARD_HOVER } from "@/lib/styles";
import { routeVarKey, shortRouteName } from "@/lib/utils/route-id";

const PALETTE = [
  "#d4a537", // accent gold
  "#2dd4bf", // electric teal
  "#7a9b5f", // success
  "#c97c2c", // warning
  "#a63d2a", // danger
  "#e8ddc7", // fg
];

interface RoutesTrendChartProps {
  routes: RouteStats[];
}

export function RoutesTrendChart({ routes }: RoutesTrendChartProps) {
  const chartConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {};
    routes.forEach((r, i) => {
      cfg[routeVarKey(r.route)] = {
        label: shortRouteName(r.route),
        color: PALETTE[i % PALETTE.length] ?? "#e8ddc7",
      };
    });
    return cfg;
  }, [routes]);

  const chartData = useMemo(() => {
    const dates = new Set<string>();
    for (const r of routes) {
      for (const h of r.history) dates.add(h.date);
    }
    const sortedDates = [...dates].sort();
    return sortedDates.map((date) => {
      const row: Record<string, string | number> = { date };
      for (const r of routes) {
        const h = r.history.find((x) => x.date === date);
        if (h && r.capacity > 0) {
          row[routeVarKey(r.route)] = Number(
            ((h.sold / r.capacity) * 100).toFixed(1),
          );
        }
      }
      return row;
    });
  }, [routes]);

  const singleDataPoint = chartData.length <= 1;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2
          id="routes-chart-heading"
          className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase"
        >
          Evolución · % ocupación por día
        </h2>
        {singleDataPoint && (
          <p className="font-mono text-[10px] text-fg-subtle">
            solo llevamos {chartData.length} día — la tendencia aparecerá con
            más registros.
          </p>
        )}
      </div>
      <Card className={CARD_HOVER}>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80 w-full">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="2 4"
                stroke="var(--color-border)"
                strokeOpacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
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
                domain={[0, 100]}
                unit="%"
              />
              <ChartTooltip
                cursor={{ stroke: "var(--color-border)" }}
                content={<ChartTooltipContent indicator="line" />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              {routes.map((r) => {
                const key = routeVarKey(r.route);
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={`var(--color-${key})`}
                    strokeWidth={1.5}
                    dot={{ r: 3, strokeWidth: 0, fill: `var(--color-${key})` }}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
