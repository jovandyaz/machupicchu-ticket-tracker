import { motion } from "motion/react";
import type { DailySummary } from "@/lib/types/aggregates";
import { useFadeIn } from "@/lib/utils/motion";
import { HistoryCalendar } from "./history/HistoryCalendar";
import { HistoryTable } from "./history/HistoryTable";
import type { Locale } from "@/i18n/config";
import { ensureLocale } from "@/i18n/client";

interface HistoryHeatmapProps {
  summaries: DailySummary[];
  locale: Locale;
}

export function HistoryHeatmap({ summaries, locale }: HistoryHeatmapProps) {
  ensureLocale(locale);
  const hasData = summaries.length > 0;
  const fade = useFadeIn();

  return (
    <div className="space-y-6">
      <motion.div {...fade(0)}>
        <HistoryCalendar summaries={summaries} />
      </motion.div>

      {hasData && (
        <motion.div {...fade(0.1)}>
          <HistoryTable summaries={summaries} />
        </motion.div>
      )}
    </div>
  );
}
