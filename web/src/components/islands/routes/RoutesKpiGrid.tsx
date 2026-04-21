import type { RouteStats } from "@/lib/types/aggregates";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CARD_HOVER, occupancyBarClass } from "@/lib/styles";
import { cn } from "@/lib/utils";

interface RoutesKpiGridProps {
  routes: RouteStats[];
}

export function RoutesKpiGrid({ routes }: RoutesKpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {routes.map((r) => {
        const pct = Math.round(r.avg_occupancy * 100);
        return (
          <Card key={r.route} className={CARD_HOVER}>
            <CardContent className="space-y-3">
              <div className="min-w-0">
                <p className="truncate font-display text-lg leading-tight text-fg">
                  {r.route}
                </p>
                <p className="mt-0.5 font-mono text-xs text-fg-muted">
                  {r.circuit}
                </p>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display text-3xl leading-none text-fg tabular-nums">
                  {pct}
                  <span className="ml-1 text-lg text-fg-muted">%</span>
                </span>
                <span className="text-right font-mono text-[11px] text-fg-muted">
                  ocupación promedio
                </span>
              </div>
              <Progress
                value={Math.min(100, pct)}
                className={cn("h-1", occupancyBarClass(pct))}
              />
              <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 font-mono text-[11px]">
                <div>
                  <p className="text-[9px] tracking-[0.2em] text-fg-subtle uppercase">
                    Velocidad
                  </p>
                  <p className="mt-0.5 text-fg tabular-nums">
                    {Math.round(r.avg_velocity).toLocaleString()} b/h
                  </p>
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.2em] text-fg-subtle uppercase">
                    Agotados
                  </p>
                  <p className="mt-0.5 text-fg tabular-nums">
                    {r.sold_out_count}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
