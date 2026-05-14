import { useMemo } from "react";
import { useTodayQuery } from "@/lib/data/use-today";
import { useTranslation } from "@/i18n/client";
import { HourlySalesChart } from "./HourlySalesChart";
import { ChartSkeletonCard, StatusCard } from "./StatusCard";

interface TodayHourlyCardProps {
  targetDate: string;
}

export function TodayHourlyCard({ targetDate }: TodayHourlyCardProps) {
  const query = useTodayQuery();
  const { t } = useTranslation(["today", "common"]);
  const readings = useMemo(
    () => query.data?.filter((r) => r.target_date === targetDate) ?? [],
    [query.data, targetDate],
  );

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

  return <HourlySalesChart readings={readings} />;
}
