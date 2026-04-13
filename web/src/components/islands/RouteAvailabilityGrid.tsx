import { useTodayQuery } from "@/lib/data/use-today";
import type { RouteReading } from "@/lib/types/record";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CARD_HOVER } from "@/lib/styles";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/client";
import { useMemo } from "react";

function barClassFor(pct: number, available: number): string {
  if (available === 0) {
    return "[&>[data-slot=progress-indicator]]:bg-danger";
  }
  if (pct > 80) return "[&>[data-slot=progress-indicator]]:bg-warning";
  return "[&>[data-slot=progress-indicator]]:bg-success";
}

export function RouteAvailabilityGrid() {
  const query = useTodayQuery();
  const { t, i18n } = useTranslation(["today", "common"]);
  const numberFmt = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);

  if (query.isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className={cn("animate-pulse", CARD_HOVER)}>
            <CardContent className="space-y-3">
              <div className="h-5 w-2/3 rounded bg-surface-elevated" />
              <div className="h-3 w-1/3 rounded bg-surface-elevated" />
              <div className="h-1 w-full rounded bg-surface-elevated" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <Card className={CARD_HOVER}>
        <CardContent>
          <p className="font-mono text-xs text-fg-muted">
            {t("common.error", { ns: "common" })}: {query.error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  const data = query.data;
  if (!data || data.length === 0) return null;
  const latest = data[data.length - 1]!;
  const routes: RouteReading[] = [...latest.routes].sort((a, b) => {
    const pa = a.capacity > 0 ? a.sold / a.capacity : 0;
    const pb = b.capacity > 0 ? b.sold / b.capacity : 0;
    return pb - pa;
  });

  return (
    <section aria-labelledby="routes-heading" className="space-y-3">
      <h2
        id="routes-heading"
        className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase"
      >
        {t("today.routes_availability_title")}
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {routes.map((r) => {
          const pct = r.capacity > 0 ? (r.sold / r.capacity) * 100 : 0;
          return (
            <Card key={`${r.route}-${r.circuit}`} className={CARD_HOVER}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg leading-tight text-fg">
                      {r.route}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-fg-muted">
                      {r.circuit}
                    </p>
                  </div>
                  <span className="font-mono text-sm text-fg tabular-nums">
                    {numberFmt.format(r.sold)}
                    <span className="text-fg-muted">
                      {" / "}
                      {numberFmt.format(r.capacity)}
                    </span>
                  </span>
                </div>
                <Progress
                  value={Math.min(100, pct)}
                  className={cn("h-1", barClassFor(pct, r.available))}
                />
                <div className="flex items-center justify-between font-mono text-[11px] text-fg-muted">
                  <span>
                    {t("today.routes_available", {
                      value: numberFmt.format(r.available),
                    })}
                  </span>
                  <span className="tabular-nums">
                    {t("today.routes_pct", { value: Math.round(pct) })}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
