import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { Reading } from "@/lib/types/record";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent } from "@/components/ui/card";
import { CARD_HOVER } from "@/lib/styles";
import { useTranslation } from "@/i18n/client";

const ROUTE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-accent-electric)",
];

const OFFICE_HOURS: readonly string[] = Array.from({ length: 16 }, (_, i) =>
  `${String(6 + i).padStart(2, "0")}:00`,
);

interface HourBucket {
  hour: string;
  [routeKey: string]: number | string;
}

function routeKey(route: string): string {
  return route.replace(/[^a-zA-Z0-9]+/g, "_");
}

function computeHourlyByRoute(readings: Reading[]): {
  buckets: HourBucket[];
  routes: Array<{ key: string; name: string }>;
} {
  // Need at least two readings: the chart plots deltas between consecutive
  // observations, so a single reading produces no data to chart.
  if (readings.length < 2) return { buckets: [], routes: [] };
  const sorted = [...readings].sort((a, b) =>
    a.time < b.time ? -1 : a.time > b.time ? 1 : 0,
  );

  const routeOrder: Array<{ key: string; name: string }> = [];
  for (const r of sorted[0]!.routes) {
    routeOrder.push({ key: routeKey(r.route), name: r.route });
  }

  const hourMap = new Map<string, Record<string, number>>();
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    const hourLabel = `${cur.time.slice(0, 2)}:00`;
    const hourEntry = hourMap.get(hourLabel) ?? {};
    for (const r of cur.routes) {
      const prevRoute = prev.routes.find((p) => p.route === r.route);
      const delta = r.sold - (prevRoute?.sold ?? 0);
      if (delta > 0) {
        const k = routeKey(r.route);
        hourEntry[k] = (hourEntry[k] ?? 0) + delta;
      }
    }
    hourMap.set(hourLabel, hourEntry);
  }

  // Expand to cover any observed hour outside the office window.
  const allHours = new Set<string>(OFFICE_HOURS);
  for (const hour of hourMap.keys()) allHours.add(hour);

  const buckets: HourBucket[] = Array.from(allHours)
    .sort((a, b) => (a < b ? -1 : 1))
    .map((hour) => {
      const row: HourBucket = { hour };
      const deltas = hourMap.get(hour) ?? {};
      for (const { key } of routeOrder) row[key] = deltas[key] ?? 0;
      return row;
    });

  return { buckets, routes: routeOrder };
}

interface Props {
  readings: Reading[];
}

export function HourlySalesChart({ readings }: Props) {
  const { t } = useTranslation(["today"]);

  const { buckets, routes } = useMemo(
    () => computeHourlyByRoute(readings),
    [readings],
  );

  const chartConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    routes.forEach((r, i) => {
      config[r.key] = {
        label: r.name,
        color: ROUTE_COLORS[i % ROUTE_COLORS.length]!,
      };
    });
    return config;
  }, [routes]);

  if (buckets.length === 0) {
    return (
      <Card className={CARD_HOVER}>
        <CardContent>
          <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
            {t("today.hourly_chart_title")}
          </p>
          <p className="mt-3 font-sans text-sm text-fg-muted">
            {t("today.hourly_chart_empty")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={CARD_HOVER}>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
            {t("today.hourly_chart_title")}
          </p>
          <p className="font-mono text-[10px] text-fg-subtle">
            {t("today.hourly_chart_subtitle")}
          </p>
        </div>
        <ChartContainer config={chartConfig} className="h-56 w-full md:h-64">
          <BarChart
            data={buckets}
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
              minTickGap={16}
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
              width={40}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={{ fill: "var(--color-border)", fillOpacity: 0.3 }}
              content={<ChartTooltipContent indicator="dot" />}
            />
            {routes.map((r, i) => (
              <Bar
                key={r.key}
                dataKey={r.key}
                stackId="routes"
                fill={ROUTE_COLORS[i % ROUTE_COLORS.length]!}
                radius={i === routes.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive
                animationDuration={600}
              />
            ))}
          </BarChart>
        </ChartContainer>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-fg-muted">
          {routes.map((r, i) => (
            <li key={r.key} className="inline-flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: ROUTE_COLORS[i % ROUTE_COLORS.length] }}
                aria-hidden="true"
              />
              <span className="truncate">{r.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
