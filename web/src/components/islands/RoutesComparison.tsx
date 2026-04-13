import { useMemo } from "react";
import { motion } from "motion/react";
import type { RouteStats } from "@/lib/types/aggregates";
import { useFadeIn } from "@/lib/utils/motion";
import { RoutesKpiGrid } from "./routes/RoutesKpiGrid";
import { RoutesRankingTable } from "./routes/RoutesRankingTable";
import { RoutesTrendChart } from "./routes/RoutesTrendChart";
import { useTranslation } from "@/i18n/client";

interface RoutesComparisonProps {
  routes: RouteStats[];
}

export function RoutesComparison({ routes }: RoutesComparisonProps) {
  const { t, i18n } = useTranslation(["routes"]);
  const sortedRoutes = useMemo(
    () => [...routes].sort((a, b) => a.route.localeCompare(b.route, i18n.language)),
    [routes, i18n.language],
  );

  const fade = useFadeIn();

  return (
    <div className="space-y-8">
      <motion.section
        {...fade(0)}
        className="space-y-3"
        aria-labelledby="routes-kpi-heading"
      >
        <h2
          id="routes-kpi-heading"
          className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase"
        >
          {t("routes.stats_heading")}
        </h2>
        <RoutesKpiGrid routes={sortedRoutes} />
      </motion.section>

      <motion.section
        {...fade(0.1)}
        aria-labelledby="routes-chart-heading"
      >
        <RoutesTrendChart routes={sortedRoutes} />
      </motion.section>

      <motion.section
        {...fade(0.2)}
        className="space-y-3"
        aria-labelledby="routes-rank-heading"
      >
        <h2
          id="routes-rank-heading"
          className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase"
        >
          {t("routes.ranking_heading")}
        </h2>
        <RoutesRankingTable routes={routes} />
      </motion.section>
    </div>
  );
}
