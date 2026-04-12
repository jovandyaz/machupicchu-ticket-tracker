import { useMemo, useState } from "react";
import type { DailySummary } from "@/lib/types/aggregates";
import { Card, CardContent } from "@/components/ui/card";
import { CARD_HOVER } from "@/lib/styles";
import { topRoute } from "@/lib/utils/aggregations";

const PAGE_SIZE = 20;

interface HistoryTableProps {
  summaries: DailySummary[];
}

export function HistoryTable({ summaries }: HistoryTableProps) {
  const [page, setPage] = useState(0);

  const sortedSummaries = useMemo(
    () => [...summaries].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [summaries],
  );
  const pageCount = Math.max(1, Math.ceil(sortedSummaries.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pagedSummaries = sortedSummaries.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  return (
    <Card className={CARD_HOVER}>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
            Días registrados
          </p>
          <p className="font-mono text-[10px] text-fg-subtle">
            página {currentPage + 1} / {pageCount}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-left text-fg-subtle">
                <th className="py-2 pr-4 font-normal tracking-[0.15em] uppercase">
                  Fecha
                </th>
                <th className="py-2 pr-4 font-normal tracking-[0.15em] uppercase">
                  Vendidos
                </th>
                <th className="py-2 pr-4 font-normal tracking-[0.15em] uppercase">
                  %
                </th>
                <th className="py-2 pr-4 font-normal tracking-[0.15em] uppercase">
                  Agotado
                </th>
                <th className="py-2 pr-4 font-normal tracking-[0.15em] uppercase">
                  Ruta top
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedSummaries.map((s) => {
                const pct =
                  s.total_capacity > 0
                    ? (s.total_sold / s.total_capacity) * 100
                    : 0;
                const top = topRoute(s);
                return (
                  <tr
                    key={s.date}
                    className="border-b border-border/50 text-fg"
                  >
                    <td className="py-2 pr-4">{s.date}</td>
                    <td className="py-2 pr-4 tabular-nums">
                      {s.total_sold.toLocaleString()}
                      <span className="text-fg-subtle">
                        {" / "}
                        {s.total_capacity.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      {pct.toFixed(0)}%
                    </td>
                    <td className="py-2 pr-4 text-fg-muted">
                      {s.sold_out_time ? s.sold_out_time.slice(0, 5) : "—"}
                    </td>
                    <td className="py-2 pr-4 text-fg-muted">
                      {top ? `${top.route} · ${top.sold}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="rounded-sm border border-border bg-surface px-2 py-1 font-mono text-[10px] tracking-[0.15em] text-fg-muted uppercase transition-colors hover:bg-surface-elevated hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
          >
            anterior
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={currentPage >= pageCount - 1}
            className="rounded-sm border border-border bg-surface px-2 py-1 font-mono text-[10px] tracking-[0.15em] text-fg-muted uppercase transition-colors hover:bg-surface-elevated hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
          >
            siguiente
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
