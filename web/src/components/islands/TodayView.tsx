import { motion } from "motion/react";
import { TodayLiveStats } from "./TodayLiveStats";
import { SoldOutProjection } from "./SoldOutProjection";
import { HourlySalesChart } from "./HourlySalesChart";
import { RouteAvailabilityGrid } from "./RouteAvailabilityGrid";
import { useFadeIn } from "@/lib/utils/motion";
import { QueryProvider } from "./QueryProvider";
import type { RouteStats } from "@/lib/types/aggregates";
import "@/i18n/client";

interface TodayViewProps {
  routeStats: RouteStats[];
}

export function TodayView({ routeStats }: TodayViewProps) {
  const fade = useFadeIn();
  const panels = [
    <TodayLiveStats key="live" />,
    <SoldOutProjection key="projection" />,
    <HourlySalesChart key="hourly" />,
    <RouteAvailabilityGrid key="grid" routeStats={routeStats} />,
  ];

  return (
    <QueryProvider>
      <div className="space-y-6">
        {panels.map((panel, i) => (
          <motion.div key={panel.key} {...fade(i * 0.15)}>
            {panel}
          </motion.div>
        ))}
      </div>
    </QueryProvider>
  );
}
