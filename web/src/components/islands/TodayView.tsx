import { motion } from "motion/react";
import { QueryProvider } from "./QueryProvider";
import { TodayLiveStats } from "./TodayLiveStats";
import { SoldOutProjection } from "./SoldOutProjection";
import { SalesVelocityChart } from "./SalesVelocityChart";
import { RouteAvailabilityGrid } from "./RouteAvailabilityGrid";
import { useFadeIn } from "@/lib/utils/motion";

/**
 * Single React tree for the "Hoy" view. All four panels share the same
 * QueryClient (and therefore the same ["today", date] cache entry) so they
 * only trigger one fetch per polling tick.
 */
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
