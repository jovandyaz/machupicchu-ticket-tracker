import { useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { useTranslation } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { useHistoryDayQuery } from "@/lib/data/use-history-day";
import { HistoryHourlyCard } from "./HistoryHourlyCard";

interface Props {
  date: string;
  onClose: () => void;
}

export function HistoryDayDetail({ date, onClose }: Props) {
  const { t, i18n } = useTranslation(["history", "today", "common"]);
  const rootRef = useRef<HTMLElement>(null);
  const query = useHistoryDayQuery(date);
  const latest = query.data?.[query.data.length - 1];
  const firstSoldOut = query.data?.find((r) => r.total_available === 0);

  const formattedDate = useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) return date;
    return new Intl.DateTimeFormat(i18n.language, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(y, m - 1, d)));
  }, [date, i18n.language]);

  const numberFmt = useMemo(
    () => new Intl.NumberFormat(i18n.language),
    [i18n.language],
  );

  useEffect(() => {
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    rootRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [date, onClose]);

  const summaryLine = latest
    ? t("history.selected_day_summary", {
        sold: numberFmt.format(latest.total_sold),
        capacity: numberFmt.format(latest.total_capacity),
      })
    : null;

  return (
    <motion.section
      ref={rootRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      tabIndex={-1}
      aria-labelledby="history-day-title"
      className="rounded-lg border border-border bg-surface-elevated p-4 md:p-6"
    >
      <header
        className={cn(
          "flex flex-col gap-3 border-b border-border pb-4",
          "sm:flex-row sm:items-start sm:justify-between",
        )}
      >
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
            {t("history.selected_day_kicker")}
          </p>
          <h2
            id="history-day-title"
            className="font-display text-xl leading-tight text-fg first-letter:uppercase sm:text-2xl"
          >
            {formattedDate}
          </h2>
          {summaryLine && (
            <p className="font-mono text-[11px] text-fg-muted">
              {summaryLine}
              {firstSoldOut && (
                <>
                  {" · "}
                  {t("today.typical_sold_out", {
                    time: firstSoldOut.time.slice(0, 5),
                  })}
                </>
              )}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("history.close_detail")}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-fg-muted transition-colors hover:bg-surface hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </header>
      <div className="mt-4">
        <HistoryHourlyCard date={date} />
      </div>
    </motion.section>
  );
}
