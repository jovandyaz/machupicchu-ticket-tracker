import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CARD_HOVER } from "@/lib/styles";

interface StatusCardProps {
  children: ReactNode;
  contentClassName?: string;
}

export function StatusCard({ children, contentClassName }: StatusCardProps) {
  return (
    <Card className={CARD_HOVER}>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

export function ChartSkeletonCard({ children }: { children?: ReactNode }) {
  return (
    <StatusCard contentClassName={children ? "space-y-2" : undefined}>
      {children}
      <div className="h-56 animate-pulse rounded bg-surface-elevated md:h-64" />
    </StatusCard>
  );
}
