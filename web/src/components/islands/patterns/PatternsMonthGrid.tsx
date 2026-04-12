import { useMemo } from "react";
import type { Patterns } from "@/lib/types/aggregates";
import { Card, CardContent } from "@/components/ui/card";
import { CARD_HOVER } from "@/lib/styles";
import { cn } from "@/lib/utils";

function monthColor(occupancy: number): string {
  if (occupancy <= 0) return "bg-surface";
  if (occupancy < 0.25) return "bg-success/40";
  if (occupancy < 0.5) return "bg-success/70";
  if (occupancy < 0.75) return "bg-warning/60";
  if (occupancy < 1) return "bg-warning";
  return "bg-danger";
}

interface PatternsMonthGridProps {
  patterns: Patterns;
}

export function PatternsMonthGrid({ patterns }: PatternsMonthGridProps) {
  const monthEntries = useMemo(
    () =>
      Object.entries(patterns.by_month).sort(([a], [b]) => a.localeCompare(b)),
    [patterns.by_month],
  );

  return (
    <Card className={CARD_HOVER}>
      <CardContent>
        {monthEntries.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {monthEntries.map(([month, occ]) => (
              <div
                key={month}
                className={cn(
                  "rounded-sm border border-border/40 p-3 transition-colors",
                  monthColor(occ),
                )}
                title={`${month} · ${Math.round(occ * 100)}%`}
              >
                <p className="font-mono text-[10px] tracking-[0.15em] text-fg-subtle uppercase">
                  {month}
                </p>
                <p className="mt-1 font-display text-2xl text-fg tabular-nums">
                  {Math.round(occ * 100)}%
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-sans text-sm text-fg-muted">
            Los meses aparecerán aquí conforme acumulemos registros.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
