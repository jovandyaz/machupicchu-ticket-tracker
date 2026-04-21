import { useMemo, useState } from "react";
import type { RouteStats } from "@/lib/types/aggregates";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CARD_HOVER, occupancyBarClass } from "@/lib/styles";
import { cn } from "@/lib/utils";
import { shortCircuitName } from "@/lib/utils/route-id";
import { useTranslation } from "@/i18n/client";

type SortKey =
  | "route"
  | "avg_occupancy"
  | "avg_sold_out_time"
  | "sold_out_count"
  | "avg_velocity";

interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
}

interface RoutesRankingTableProps {
  routes: RouteStats[];
}

function hasSoldOut(time: string | undefined): time is string {
  return typeof time === "string" && time.length > 0;
}

function compareSortable(
  a: RouteStats,
  b: RouteStats,
  key: SortKey,
  dir: "asc" | "desc",
  collator: Intl.Collator,
): number {
  const mult = dir === "asc" ? 1 : -1;
  if (key === "route") {
    return collator.compare(a.route, b.route) * mult;
  }
  if (key === "avg_sold_out_time") {
    const aHas = hasSoldOut(a.avg_sold_out_time);
    const bHas = hasSoldOut(b.avg_sold_out_time);
    if (!aHas && !bHas) return 0;
    if (!aHas) return 1;
    if (!bHas) return -1;
    return collator.compare(a.avg_sold_out_time!, b.avg_sold_out_time!) * mult;
  }
  return (a[key] - b[key]) * mult;
}

export function RoutesRankingTable({ routes }: RoutesRankingTableProps) {
  const { t, i18n } = useTranslation(["routes"]);
  const [sort, setSort] = useState<SortState>({
    key: "avg_occupancy",
    dir: "desc",
  });

  const collator = useMemo(
    () => new Intl.Collator(i18n.language),
    [i18n.language],
  );

  const rankedRoutes = useMemo(() => {
    const copy = [...routes];
    copy.sort((a, b) => compareSortable(a, b, sort.key, sort.dir, collator));
    return copy;
  }, [routes, sort, collator]);

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (prev.key !== key) {
        return { key, dir: key === "route" ? "asc" : "desc" };
      }
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  }

  const sortIndicator = (key: SortKey) => {
    if (sort.key !== key) return "";
    return sort.dir === "asc" ? " ▲" : " ▼";
  };

  const headers: Array<{ label: string; k: SortKey; numeric?: boolean }> = [
    { label: t("routes.col_route"), k: "route" },
    { label: t("routes.col_occupancy"), k: "avg_occupancy", numeric: true },
    { label: t("routes.col_sold_out_time"), k: "avg_sold_out_time", numeric: true },
    { label: t("routes.col_sold_out_count"), k: "sold_out_count", numeric: true },
    { label: t("routes.col_velocity"), k: "avg_velocity", numeric: true },
  ];

  return (
    <Card className={CARD_HOVER}>
      <CardContent className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-border text-left text-fg-subtle">
              {headers.map(({ label, k, numeric }) => (
                <SortableTh
                  key={k}
                  label={label}
                  k={k}
                  sort={sort}
                  onClick={() => toggleSort(k)}
                  indicator={sortIndicator(k)}
                  numeric={numeric}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {rankedRoutes.map((r) => {
              const pct = r.avg_occupancy * 100;
              const pctClamped = Math.min(100, Math.max(0, pct));
              const totalDays = r.history.length;
              return (
                <tr
                  key={r.route}
                  className="border-b border-border/50 text-fg"
                >
                  <td className="py-3 pr-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-sans text-sm leading-tight text-fg">
                        {r.route}
                      </span>
                      <span className="font-mono text-[10px] tracking-widest text-fg-subtle uppercase">
                        {shortCircuitName(r.circuit)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center justify-end gap-3">
                      <span className="tabular-nums text-fg">
                        {pct.toFixed(1)}%
                      </span>
                      <Progress
                        value={pctClamped}
                        className={cn("h-1 w-20", occupancyBarClass(pct))}
                      />
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {r.avg_sold_out_time ? (
                      <span className="text-fg">{r.avg_sold_out_time.slice(0, 5)}</span>
                    ) : (
                      <span className="text-fg-subtle">
                        {t("routes.never_sold_out")}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-fg-muted">
                    {t("routes.sold_out_days", {
                      count: r.sold_out_count,
                      total: totalDays,
                    })}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-fg-muted">
                    {Math.round(r.avg_velocity).toLocaleString()} b/h
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

interface SortableThProps {
  label: string;
  k: SortKey;
  sort: SortState;
  onClick: () => void;
  indicator: string;
  numeric?: boolean;
}

function SortableTh({
  label,
  sort,
  onClick,
  indicator,
  numeric,
  k,
}: SortableThProps) {
  const active = sort.key === k;
  return (
    <th
      className={cn(
        "py-2 pr-4 font-normal tracking-[0.15em] uppercase",
        numeric && "text-right",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "cursor-pointer font-mono text-[10px] tracking-[0.15em] uppercase transition-colors hover:text-fg",
          active ? "text-fg" : "text-fg-subtle",
        )}
      >
        {label}
        <span className="inline-block w-3 text-accent">{indicator}</span>
      </button>
    </th>
  );
}
