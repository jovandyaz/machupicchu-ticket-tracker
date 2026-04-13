import { motion } from "motion/react";
import type { Patterns } from "@/lib/types/aggregates";
import { Card, CardContent } from "@/components/ui/card";
import { CARD_HOVER } from "@/lib/styles";
import { allZero } from "@/lib/utils/aggregations";
import { useFadeIn } from "@/lib/utils/motion";
import { PatternsHourChart } from "./patterns/PatternsHourChart";
import { PatternsInsightCards } from "./patterns/PatternsInsightCards";
import { PatternsMonthGrid } from "./patterns/PatternsMonthGrid";
import { PatternsWeekdayRadar } from "./patterns/PatternsWeekdayRadar";
import { ensureLocale, useTranslation } from "@/i18n/client";
import type { Locale } from "@/i18n/config";

interface PatternsInsightsProps {
  patterns: Patterns;
  locale: Locale;
}

export function PatternsInsights({ patterns, locale }: PatternsInsightsProps) {
  ensureLocale(locale);
  const { t } = useTranslation(["patterns"]);
  const insufficientData =
    allZero(patterns.by_hour) &&
    allZero(patterns.by_weekday) &&
    Object.keys(patterns.by_month).length === 0;

  const fade = useFadeIn();

  return (
    <div className="space-y-8">
      <motion.section
        {...fade(0)}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
        aria-labelledby="patterns-insights-heading"
      >
        <PatternsInsightCards patterns={patterns} />
      </motion.section>

      {insufficientData && (
        <Card className={CARD_HOVER}>
          <CardContent>
            <p className="font-display text-xl text-fg">
              {t("patterns.insufficient_title")}
            </p>
            <p className="mt-1 font-sans text-sm text-fg-muted">
              {t("patterns.insufficient_body")}
            </p>
          </CardContent>
        </Card>
      )}

      <motion.section
        {...fade(0.1)}
        className="space-y-3"
        aria-labelledby="patterns-hour-heading"
      >
        <h2
          id="patterns-hour-heading"
          className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase"
        >
          {t("patterns.hour_heading")}
        </h2>
        <PatternsHourChart patterns={patterns} />
      </motion.section>

      <motion.section
        {...fade(0.2)}
        className="space-y-3"
        aria-labelledby="patterns-weekday-heading"
      >
        <h2
          id="patterns-weekday-heading"
          className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase"
        >
          {t("patterns.weekday_heading")}
        </h2>
        <PatternsWeekdayRadar patterns={patterns} />
      </motion.section>

      <motion.section
        {...fade(0.3)}
        className="space-y-3"
        aria-labelledby="patterns-month-heading"
      >
        <h2
          id="patterns-month-heading"
          className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase"
        >
          {t("patterns.month_heading")}
        </h2>
        <PatternsMonthGrid patterns={patterns} />
      </motion.section>
    </div>
  );
}
