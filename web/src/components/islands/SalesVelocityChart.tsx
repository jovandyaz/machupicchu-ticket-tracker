import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTodayQuery } from "@/lib/data/use-today";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent } from "@/components/ui/card";
import { CARD_HOVER } from "@/lib/styles";

const chartConfig = {
  total_sold: {
    label: "Vendidos",
    color: "var(--color-accent)",
  },
} satisfies ChartConfig;

export function SalesVelocityChart() {
  const query = useTodayQuery();

  if (query.isPending) {
    return (
      <Card className={CARD_HOVER}>
        <CardContent>
          <div className="h-64 animate-pulse rounded bg-surface-elevated" />
        </CardContent>
      </Card>
    );
  }

  if (query.isError) {
    return (
      <Card className={CARD_HOVER}>
        <CardContent>
          <p className="font-mono text-xs text-fg-muted">
            error cargando velocidad: {query.error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  const data = query.data ?? [];
  if (data.length === 0) {
    return (
      <Card className={CARD_HOVER}>
        <CardContent>
          <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
            Velocidad de ventas
          </p>
          <p className="mt-3 font-sans text-sm text-fg-muted">
            Velocidad de ventas aparecerá conforme avance el día.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((r) => ({
    time: r.time.slice(0, 5),
    total_sold: r.total_sold,
  }));

  return (
    <Card className={CARD_HOVER}>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
            Velocidad de ventas
          </p>
          <p className="font-mono text-[10px] text-fg-subtle">
            acumulado por lectura
          </p>
        </div>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="sales-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-accent)"
                  stopOpacity={0.5}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-accent)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="var(--color-border)"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="time"
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
              width={48}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--color-border)" }}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              type="monotone"
              dataKey="total_sold"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              fill="url(#sales-gradient)"
              fillOpacity={1}
              isAnimationActive
              animationDuration={800}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
