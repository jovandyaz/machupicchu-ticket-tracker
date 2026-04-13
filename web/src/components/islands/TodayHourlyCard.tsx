import { useTodayQuery } from "@/lib/data/use-today";
import { useTranslation } from "@/i18n/client";
import { HourlySalesChart } from "./HourlySalesChart";
import { ChartSkeletonCard, StatusCard } from "./StatusCard";

export function TodayHourlyCard() {
  const query = useTodayQuery();
  const { t } = useTranslation(["today", "common"]);

  if (query.isPending) {
    return <ChartSkeletonCard />;
  }

  if (query.isError) {
    return (
      <StatusCard>
        <p className="font-mono text-xs text-fg-muted">
          {t("common.error", { ns: "common" })}: {query.error.message}
        </p>
      </StatusCard>
    );
  }

  return <HourlySalesChart readings={query.data ?? []} />;
}
