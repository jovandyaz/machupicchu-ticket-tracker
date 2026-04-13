import { useTodayQuery } from "@/lib/data/use-today";
import { projectSoldOut } from "@/lib/utils/projection";
import { Card, CardContent } from "@/components/ui/card";
import { CARD_HOVER } from "@/lib/styles";
import { useTranslation } from "@/i18n/client";

const CONFIDENCE_KEY: Record<string, string> = {
  high: "common.confidence_high",
  medium: "common.confidence_medium",
  low: "common.confidence_low",
};

export function SoldOutProjection() {
  const query = useTodayQuery();
  const { t } = useTranslation(["today", "common"]);

  if (query.isPending || query.isError) return null;
  const data = query.data;
  if (!data || data.length === 0) return null;

  const projection = projectSoldOut(data);
  if (!projection) return null;
  const confidenceKey =
    CONFIDENCE_KEY[projection.confidence] ?? "common.confidence_low";

  return (
    <Card size="sm" className={CARD_HOVER}>
      <CardContent className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
          {t("today.projection_title")}
        </p>
        <p className="font-sans text-sm text-fg-muted">
          {t("today.projection_sold_out", { time: projection.eta })}
        </p>
        <p className="ml-auto font-mono text-[11px] text-fg-subtle">
          {t("common.confidence")}: {t(confidenceKey)}
        </p>
      </CardContent>
    </Card>
  );
}
