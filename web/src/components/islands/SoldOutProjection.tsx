import { useTodayQuery } from "@/lib/data/use-today";
import { projectSoldOut } from "@/lib/utils/projection";
import { Card, CardContent } from "@/components/ui/card";
import { CARD_HOVER } from "@/lib/styles";

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "alta",
  medium: "media",
  low: "baja",
};

export function SoldOutProjection() {
  const query = useTodayQuery();

  if (query.isPending || query.isError) return null;
  const data = query.data;
  if (!data || data.length === 0) return null;

  const projection = projectSoldOut(data);
  if (!projection) return null;

  return (
    <Card size="sm" className={CARD_HOVER}>
      <CardContent className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
          Proyección
        </p>
        <p className="font-sans text-sm text-fg-muted">
          agotado{" "}
          <span className="font-mono text-fg">~{projection.eta}</span> PET
        </p>
        <p className="ml-auto font-mono text-[11px] text-fg-subtle">
          confianza: {CONFIDENCE_LABEL[projection.confidence]}
        </p>
      </CardContent>
    </Card>
  );
}
