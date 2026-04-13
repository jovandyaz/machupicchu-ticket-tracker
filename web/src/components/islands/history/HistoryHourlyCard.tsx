import { useHistoryDayQuery } from "@/lib/data/use-history-day";
import { useTranslation } from "@/i18n/client";
import { HourlySalesChart } from "../HourlySalesChart";
import { ChartSkeletonCard, StatusCard } from "../StatusCard";

interface Props {
  date: string;
}

export function HistoryHourlyCard({ date }: Props) {
  const query = useHistoryDayQuery(date);
  const { t } = useTranslation(["history", "common"]);

  if (query.isPending) {
    return (
      <ChartSkeletonCard>
        <p className="font-mono text-[10px] text-fg-muted">
          {t("history.loading_day", { date })}
        </p>
      </ChartSkeletonCard>
    );
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

  const readings = query.data ?? [];

  if (readings.length === 0) {
    return (
      <StatusCard>
        <p className="font-sans text-sm text-fg-muted">
          {t("history.no_data", { date })}
        </p>
      </StatusCard>
    );
  }

  if (readings.length < 2) {
    return (
      <StatusCard>
        <p className="font-sans text-sm text-fg-muted">
          {t("history.insufficient_readings")}
        </p>
      </StatusCard>
    );
  }

  return <HourlySalesChart readings={readings} />;
}
