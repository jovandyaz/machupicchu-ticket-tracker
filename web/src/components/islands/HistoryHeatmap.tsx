import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { DailySummary } from "@/lib/types/aggregates";
import { useFadeIn } from "@/lib/utils/motion";
import { HistoryCalendar } from "./history/HistoryCalendar";
import { HistoryTable } from "./history/HistoryTable";
import { HistoryDayDetail } from "./history/HistoryDayDetail";
import { QueryProvider } from "./QueryProvider";
import { ensureLocale } from "@/i18n/client";
import type { Locale } from "@/i18n/config";

interface HistoryHeatmapProps {
  summaries: DailySummary[];
  locale: Locale;
}

export function HistoryHeatmap({ summaries, locale }: HistoryHeatmapProps) {
  ensureLocale(locale);
  const hasData = summaries.length > 0;
  const fade = useFadeIn();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <QueryProvider>
      <div className="space-y-6">
        <motion.div {...fade(0)}>
          <HistoryCalendar
            summaries={summaries}
            selectedDate={selectedDate}
            onSelectDay={setSelectedDate}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {selectedDate && (
            <HistoryDayDetail
              key={selectedDate}
              date={selectedDate}
              onClose={() => setSelectedDate(null)}
            />
          )}
        </AnimatePresence>

        {hasData && (
          <motion.div {...fade(0.1)}>
            <HistoryTable summaries={summaries} />
          </motion.div>
        )}
      </div>
    </QueryProvider>
  );
}
