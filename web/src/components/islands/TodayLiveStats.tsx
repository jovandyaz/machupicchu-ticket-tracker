import { useEffect, useMemo, useState } from "react";
import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { isPollingActive, useTodayQuery } from "@/lib/data/use-today";
import type { Reading } from "@/lib/types/record";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CARD_HOVER } from "@/lib/styles";
import { timeToSeconds } from "@/lib/utils/time";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/client";

/**
 * Animates an integer motion value from the previous value to `target` over a
 * spring, returning the current rounded integer for display.
 */
function useAnimatedInteger(target: number, reduceMotion: boolean): number {
  const mv = useMotionValue(target);
  const [display, setDisplay] = useState<number>(target);

  useEffect(() => {
    if (reduceMotion) {
      mv.set(target);
      setDisplay(target);
      return;
    }
    const controls = animate(mv, target, {
      type: "spring",
      stiffness: 90,
      damping: 18,
      mass: 1,
    });
    const unsub = mv.on("change", (v) => setDisplay(Math.round(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [target, reduceMotion, mv]);

  return display;
}

type Status = "available" | "critical" | "sold-out";

function deriveStatus(latest: Reading): Status {
  if (latest.total_available === 0) return "sold-out";
  const pct = latest.total_sold / latest.total_capacity;
  if (pct > 0.8) return "critical";
  return "available";
}

function computeVelocity(readings: Reading[]): number | null {
  // Use the last ~6 readings; compute simple slope in tickets/hour.
  const tail = readings.slice(-6);
  if (tail.length < 2) return null;
  const first = tail[0]!;
  const last = tail[tail.length - 1]!;
  const dt = timeToSeconds(last.time) - timeToSeconds(first.time);
  if (dt <= 0) return null;
  const dy = last.total_sold - first.total_sold;
  return (dy / dt) * 3600;
}

function statusPresentation(status: Status): {
  labelKey: string;
  className: string;
  barClass: string;
} {
  switch (status) {
    case "sold-out":
      return {
        labelKey: "today.status_sold_out",
        className: "bg-danger/15 text-danger",
        barClass: "[&>[data-slot=progress-indicator]]:bg-danger",
      };
    case "critical":
      return {
        labelKey: "today.status_critical",
        className: "bg-warning/15 text-warning",
        barClass: "[&>[data-slot=progress-indicator]]:bg-warning",
      };
    case "available":
      return {
        labelKey: "today.status_available",
        className: "bg-success/15 text-success",
        barClass: "[&>[data-slot=progress-indicator]]:bg-success",
      };
  }
}

function LoadingCard() {
  const { t } = useTranslation(["today"]);
  return (
    <Card className={cn("animate-pulse", CARD_HOVER)}>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-5xl text-fg-subtle">000</span>
          <span className="font-display text-2xl text-fg-subtle">/ 1,000</span>
          <span className="ml-auto inline-flex h-5 w-20 rounded-4xl bg-surface-elevated" />
        </div>
        <div className="h-1 w-full rounded-full bg-surface-elevated" />
        <div className="flex items-center justify-between font-mono text-xs text-fg-subtle">
          <span>{t("today.loading_updated")}</span>
          <span className="inline-flex h-2 w-2 rounded-full bg-surface-elevated" />
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorCard({ message }: { message: string }) {
  const { t } = useTranslation(["today"]);
  return (
    <Card className={CARD_HOVER}>
      <CardContent>
        <p className="font-mono text-xs text-fg-muted">
          {t("today.error_loading")}
        </p>
        <p className="mt-1 font-sans text-sm text-fg-muted">{message}</p>
      </CardContent>
    </Card>
  );
}

function EmptyCard() {
  const { t } = useTranslation(["today"]);
  return (
    <Card className={CARD_HOVER}>
      <CardContent>
        <p className="font-display text-xl text-fg">
          {t("today.empty_title")}
        </p>
        <p className="mt-1 font-sans text-sm text-fg-muted">
          {t("today.empty_body")}
        </p>
      </CardContent>
    </Card>
  );
}

export function TodayLiveStats() {
  const query = useTodayQuery();
  const reduce = useReducedMotion() ?? false;
  const latest = query.data?.[query.data.length - 1];
  const animatedSold = useAnimatedInteger(latest?.total_sold ?? 0, reduce);
  const { t, i18n } = useTranslation(["today", "common"]);
  const numberFmt = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);
  const targetDateLabel = useMemo(() => {
    if (!latest?.target_date) return null;
    const [y, m, d] = latest.target_date.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Intl.DateTimeFormat(i18n.language, {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(y, m - 1, d)));
  }, [latest?.target_date, i18n.language]);

  if (query.isPending) return <LoadingCard />;
  if (query.isError) return <ErrorCard message={query.error.message} />;
  const data = query.data;
  if (!data || data.length === 0 || !latest) return <EmptyCard />;

  const pct =
    latest.total_capacity > 0
      ? (latest.total_sold / latest.total_capacity) * 100
      : 0;
  const status = deriveStatus(latest);
  const presentation = statusPresentation(status);
  const velocity = computeVelocity(data);
  const polling = isPollingActive(data);

  return (
    <Card className={CARD_HOVER}>
      <CardContent className="space-y-4">
        {targetDateLabel && (
          <p className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">
            {t("today.for_target", { date: targetDateLabel })}
          </p>
        )}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className="font-display text-5xl leading-none text-fg tabular-nums"
            aria-label={`${latest.total_sold} ${t("today.sold")}`}
          >
            {numberFmt.format(animatedSold)}
          </span>
          <span className="font-display text-2xl leading-none text-fg-muted">
            {t("today.sold_of", { value: numberFmt.format(latest.total_capacity) })}
          </span>
          <Badge className={cn("ml-auto uppercase", presentation.className)}>
            {t(presentation.labelKey)}
          </Badge>
        </div>

        <Progress
          value={Math.min(100, pct)}
          className={cn("h-1.5", presentation.barClass)}
        />

        <div className="flex items-center justify-between font-mono text-xs text-fg-muted">
          <span>{t("today.updated_at_time", { time: latest.time })}</span>
          {polling && (
            <span
              className="inline-flex items-center gap-1.5"
              aria-label={t("today.polling_active")}
            >
              <span className="relative inline-flex h-2 w-2">
                <span className="live-pulse absolute inset-0 rounded-full bg-accent-electric" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-electric" />
              </span>
              {t("today.live")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-border pt-3 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
              {t("today.sold_today")}
            </p>
            <p className="mt-1 font-mono text-sm text-fg">
              {latest.tickets_sold_today != null
                ? numberFmt.format(latest.tickets_sold_today)
                : "—"}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
              {t("today.velocity")}
            </p>
            <p className="mt-1 font-mono text-sm text-fg">
              {velocity != null && velocity > 0
                ? t("today.velocity_value", { value: numberFmt.format(Math.round(velocity)) })
                : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
