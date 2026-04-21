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
import { useTranslation } from "@/i18n/client";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--color-fg)",
];

interface RoutesTrendChartProps {
  routes: RouteStats[];
}

const SOLD_OUT_SUFFIX = "__soldOut";
const soldOutKey = (routeKey: string) => `${routeKey}${SOLD_OUT_SUFFIX}`;

interface DotRenderProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: Record<string, unknown>;
}

function createSoldOutDot(routeKey: string, color: string) {
  const soldOutField = soldOutKey(routeKey);
  return function SoldOutAwareDot(props: DotRenderProps) {
    const { cx, cy, payload, index } = props;
    const dotKey = `${routeKey}-${index}`;
    if (cx == null || cy == null) {
      return <g key={dotKey} />;
    }
    const soldOut = payload?.[soldOutField];
    if (typeof soldOut === "string") {
      return (
        <g key={dotKey}>
          <circle
            cx={cx}
            cy={cy}
            r={6}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            opacity={0.45}
          />
          <circle cx={cx} cy={cy} r={3} fill={color} />
        </g>
      );
    }
    return <circle key={dotKey} cx={cx} cy={cy} r={3} fill={color} />;
  };
}

export function RoutesTrendChart({ routes }: RoutesTrendChartProps) {
  const { t } = useTranslation(["routes"]);

  const chartConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {};
    routes.forEach((r, i) => {
      cfg[routeVarKey(r.route)] = {
        label: shortRouteName(r.route),
        color: PALETTE[i % PALETTE.length] ?? "var(--color-fg)",
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
      const row: Record<string, string | number | null> = { date };
      for (const r of routes) {
        const h = r.history.find((x) => x.date === date);
        const key = routeVarKey(r.route);
        if (h && r.capacity > 0) {
          row[key] = Number(((h.sold / r.capacity) * 100).toFixed(1));
          row[soldOutKey(key)] = h.sold_out_time
            ? h.sold_out_time.slice(0, 5)
            : null;
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
          {t("routes.trend_chart_heading")}
        </h2>
        {singleDataPoint && (
          <p className="font-mono text-[10px] text-fg-subtle">
            {t("routes.trend_chart_sparse", { count: chartData.length })}
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
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value, name, item) => {
                      const key = String(name);
                      const label = chartConfig[key]?.label ?? key;
                      const row = item.payload as Record<string, unknown>;
                      const soldOut = row[soldOutKey(key)];
                      const pct =
                        typeof value === "number"
                          ? `${value.toFixed(1)}%`
                          : String(value);
                      return (
                        <div className="flex w-full items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-1 self-stretch rounded-[1px]"
                              style={{ backgroundColor: `var(--color-${key})` }}
                            />
                            <span className="text-muted-foreground">
                              {label}
                            </span>
                          </div>
                          <span className="font-mono font-medium text-foreground tabular-nums">
                            {pct}
                            {typeof soldOut === "string" ? (
                              <span className="ml-2 text-muted-foreground">
                                {t("routes.sold_out_at", { time: soldOut })}
                              </span>
                            ) : null}
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              {routes.map((r) => {
                const key = routeVarKey(r.route);
                const color = `var(--color-${key})`;
                return (
                  <Line
                    key={key}
                    type="linear"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={1.5}
                    dot={createSoldOutDot(key, color)}
                    activeDot={{ r: 5 }}
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
