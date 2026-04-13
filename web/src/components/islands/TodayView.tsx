import { motion } from "motion/react";
import { TodayLiveStats } from "./TodayLiveStats";
import { SoldOutProjection } from "./SoldOutProjection";
import { SalesVelocityChart } from "./SalesVelocityChart";
import { RouteAvailabilityGrid } from "./RouteAvailabilityGrid";
import { useFadeIn } from "@/lib/utils/motion";
import { QueryProvider } from "./QueryProvider";
import "@/i18n/client";

export function TodayView() {
  const fade = useFadeIn();
  const panels = [
    <TodayLiveStats key="live" />,
    <SoldOutProjection key="projection" />,
    <SalesVelocityChart key="velocity" />,
    <RouteAvailabilityGrid key="grid" />,
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
