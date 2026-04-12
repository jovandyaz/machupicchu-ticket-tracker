import { useMemo, useState } from "react";
import type { RouteStats } from "@/lib/types/aggregates";
import { Card, CardContent } from "@/components/ui/card";
import { CARD_HOVER } from "@/lib/styles";
import { cn } from "@/lib/utils";

type SortKey =
  | "route"
  | "circuit"
  | "capacity"
  | "avg_occupancy"
  | "avg_velocity"
  | "sold_out_count";

interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
}

interface RoutesRankingTableProps {
  routes: RouteStats[];
}

export function RoutesRankingTable({ routes }: RoutesRankingTableProps) {
  const [sort, setSort] = useState<SortState>({
    key: "avg_occupancy",
    dir: "desc",
  });

  const rankedRoutes = useMemo(() => {
    const copy = [...routes];
    copy.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const va = a[sort.key];
      const vb = b[sort.key];
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb), "es") * dir;
    });
    return copy;
  }, [routes, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (prev.key !== key) {
        return {
          key,
          dir: key === "route" || key === "circuit" ? "asc" : "desc",
        };
      }
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  }

  const sortIndicator = (key: SortKey) => {
    if (sort.key !== key) return "";
    return sort.dir === "asc" ? " ▲" : " ▼";
  };

  const headers: Array<{ label: string; k: SortKey; numeric?: boolean }> = [
    { label: "Ruta", k: "route" },
    { label: "Circuito", k: "circuit" },
    { label: "Capacidad", k: "capacity", numeric: true },
    { label: "Ocupación", k: "avg_occupancy", numeric: true },
    { label: "Velocidad", k: "avg_velocity", numeric: true },
    { label: "Agotados", k: "sold_out_count", numeric: true },
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
            {rankedRoutes.map((r) => (
              <tr
                key={r.route}
                className="border-b border-border/50 text-fg"
              >
                <td className="py-2 pr-4">{r.route}</td>
                <td className="py-2 pr-4 text-fg-muted">{r.circuit}</td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {r.capacity.toLocaleString()}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {(r.avg_occupancy * 100).toFixed(1)}%
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {Math.round(r.avg_velocity).toLocaleString()} b/h
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {r.sold_out_count}
                </td>
              </tr>
            ))}
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
