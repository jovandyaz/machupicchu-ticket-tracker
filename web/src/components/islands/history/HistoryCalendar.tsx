import { useMemo } from "react";
import type { DailySummary } from "@/lib/types/aggregates";
import { Card, CardContent } from "@/components/ui/card";
import { CARD_HOVER } from "@/lib/styles";
import { cn } from "@/lib/utils";
import {
  bucketFor,
  buildHeatmapGrid,
  type HeatmapBucket,
  type HeatmapCell,
  parseIsoDate,
  shortWeekday,
} from "@/lib/utils/aggregations";

const BUCKET_CLASS: Record<HeatmapBucket, string> = {
  empty: "bg-surface",
  low: "bg-success/40",
  mid: "bg-success/70",
  high: "bg-warning/60",
  peak: "bg-warning",
  "sold-out": "bg-danger",
};

const BUCKET_LEGEND: ReadonlyArray<{ bucket: HeatmapBucket; label: string }> = [
  { bucket: "empty", label: "sin datos" },
  { bucket: "low", label: "0–25%" },
  { bucket: "mid", label: "25–50%" },
  { bucket: "high", label: "50–75%" },
  { bucket: "peak", label: "75–99%" },
  { bucket: "sold-out", label: "agotado" },
];

const MONTH_LABELS_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

interface HistoryCalendarProps {
  summaries: DailySummary[];
  monthsBack?: number;
  selectedDate?: string | null;
  onSelectDay?: (date: string) => void;
}

interface CalendarCellProps {
  cell: HeatmapCell | undefined;
  isSelected: boolean;
  onSelect?: (date: string) => void;
}

function cellTitle(cell: HeatmapCell): string {
  const { summary, date } = cell;
  if (!summary) return `${date} · sin datos`;
  const sold = summary.total_sold.toLocaleString();
  const capacity = summary.total_capacity.toLocaleString();
  const soldOut = summary.sold_out_time
    ? ` · agotado ${summary.sold_out_time.slice(0, 5)}`
    : "";
  return `${date} · ${sold}/${capacity} vendidos${soldOut}`;
}

function CalendarCell({ cell, isSelected, onSelect }: CalendarCellProps) {
  if (!cell) {
    return <span className="size-3 shrink-0" aria-hidden="true" />;
  }

  const bucket = bucketFor(cell.summary);
  const title = cellTitle(cell);

  if (!cell.summary) {
    return (
      <span
        title={title}
        className={cn(
          "size-3 shrink-0 rounded-sm border border-border/30 opacity-40",
          BUCKET_CLASS[bucket],
        )}
      />
    );
  }

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={isSelected}
      onClick={() => onSelect?.(cell.date)}
      className={cn(
        "size-3 shrink-0 rounded-sm border border-border/30 cursor-pointer transition-all hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        BUCKET_CLASS[bucket],
        isSelected && "ring-2 ring-accent ring-offset-1 ring-offset-background",
      )}
    />
  );
}

export function HistoryCalendar({
  summaries,
  monthsBack = 6,
  selectedDate = null,
  onSelectDay,
}: HistoryCalendarProps) {
  const hasData = summaries.length > 0;

  const { totalWeeks, months, rowsByWeekday } = useMemo(() => {
    const end = hasData
      ? summaries.reduce<Date>((acc, s) => {
          const d = parseIsoDate(s.date);
          return d > acc ? d : acc;
        }, parseIsoDate(summaries[0]!.date))
      : new Date();
    const cells = buildHeatmapGrid(summaries, end, monthsBack);

    const months: Array<{ weekIndex: number; label: string }> = [];
    let lastMonth = -1;
    for (const c of cells) {
      if (c.weekday !== 0) continue;
      const d = parseIsoDate(c.date);
      const m = d.getUTCMonth();
      if (m !== lastMonth) {
        months.push({
          weekIndex: c.weekIndex,
          label: MONTH_LABELS_ES[m] ?? "",
        });
        lastMonth = m;
      }
    }

    const rowsByWeekday: Array<Map<number, HeatmapCell>> = Array.from(
      { length: 7 },
      () => new Map(),
    );
    for (const c of cells) {
      rowsByWeekday[c.weekday]!.set(c.weekIndex, c);
    }
    const totalWeeks =
      cells.length > 0 ? cells[cells.length - 1]!.weekIndex + 1 : 0;
    return { totalWeeks, months, rowsByWeekday };
  }, [summaries, hasData, monthsBack]);

  return (
    <Card className={CARD_HOVER}>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
            Calendario · últimos {monthsBack} meses
          </p>
          <p className="font-mono text-[10px] text-fg-subtle">
            {hasData
              ? `${summaries.length} día${summaries.length === 1 ? "" : "s"}`
              : "sin datos todavía"}
          </p>
        </div>

        {!hasData ? (
          <p className="font-sans text-sm text-fg-muted">
            Histórico irá apareciendo aquí conforme acumulemos días.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="inline-flex min-w-max flex-col gap-1">
                <div
                  className="relative h-4"
                  style={{
                    paddingLeft: "1.75rem",
                    width: `calc(1.75rem + ${totalWeeks} * 0.875rem)`,
                  }}
                >
                  {months.map((m, i) => (
                    <span
                      key={`${m.label}-${i}`}
                      className="absolute top-0 font-mono text-[10px] text-fg-subtle uppercase"
                      style={{
                        left: `calc(1.75rem + ${m.weekIndex} * 0.875rem)`,
                      }}
                    >
                      {m.label}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col gap-0.5">
                  {rowsByWeekday.map((row, weekdayIdx) => (
                    <div
                      key={weekdayIdx}
                      className="flex items-center gap-1"
                    >
                      <span className="w-6 shrink-0 font-mono text-[9px] text-fg-subtle uppercase">
                        {weekdayIdx % 2 === 1 ? shortWeekday(weekdayIdx) : ""}
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: totalWeeks }).map((_, weekIdx) => {
                          const cell = row.get(weekIdx);
                          return (
                            <CalendarCell
                              key={weekIdx}
                              cell={cell}
                              isSelected={
                                cell != null && selectedDate === cell.date
                              }
                              onSelect={onSelectDay}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 font-mono text-[10px] text-fg-subtle">
              <span className="uppercase">leyenda</span>
              {BUCKET_LEGEND.map(({ bucket, label }) => (
                <span
                  key={bucket}
                  className="inline-flex items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "size-2.5 rounded-sm border border-border/30",
                      BUCKET_CLASS[bucket],
                    )}
                    aria-hidden="true"
                  />
                  {label}
                </span>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
