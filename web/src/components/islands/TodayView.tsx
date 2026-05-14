import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { TodayLiveStats } from "./TodayLiveStats";
import { TodayHourlyCard } from "./TodayHourlyCard";
import { RouteAvailabilityGrid } from "./RouteAvailabilityGrid";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFadeIn } from "@/lib/utils/motion";
import { QueryProvider } from "./QueryProvider";
import type { RouteStats } from "@/lib/types/aggregates";
import { ensureLocale, useTranslation } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { computeTargetDates } from "@/lib/data/today-targets";

interface TodayViewProps {
  routeStats: RouteStats[];
  locale: Locale;
}

function formatTabLabel(isoDate: string, language: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Intl.DateTimeFormat(language, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

function TodayViewInner({ routeStats }: { routeStats: RouteStats[] }) {
  const { t, i18n } = useTranslation(["today"]);
  const targetDates = useMemo(() => computeTargetDates(), []);
  const [selected, setSelected] = useState<string>(targetDates[0]);
  const fade = useFadeIn();

  const panels = [
    <TodayLiveStats key="live" targetDate={selected} />,
    <TodayHourlyCard key="hourly" targetDate={selected} />,
    <RouteAvailabilityGrid key="grid" routeStats={routeStats} targetDate={selected} />,
  ];

  return (
    <div className="space-y-6">
      <Tabs value={selected} onValueChange={setSelected}>
        <TabsList aria-label={t("today.tabs_aria_label")}>
          {targetDates.map((d) => (
            <TabsTrigger key={d} value={d}>
              {formatTabLabel(d, i18n.language)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {panels.map((panel, i) => (
        <motion.div key={panel.key} {...fade(i * 0.15)}>
          {panel}
        </motion.div>
      ))}
    </div>
  );
}

export function TodayView({ routeStats, locale }: TodayViewProps) {
  ensureLocale(locale);
  return (
    <QueryProvider>
      <TodayViewInner routeStats={routeStats} />
    </QueryProvider>
  );
}
