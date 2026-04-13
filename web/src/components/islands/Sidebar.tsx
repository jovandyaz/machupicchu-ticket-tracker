import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  Compass,
  ExternalLink,
  LineChart,
  MapPin,
  Route,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { href, isActive } from "@/lib/utils/url";
import { useTranslation } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { LanguageToggle } from "./LanguageToggle";

interface SidebarSection {
  href: string;
  labelKey: string;
  icon: typeof MapPin;
}

const SECTIONS: readonly SidebarSection[] = [
  { href: "/", labelKey: "layout.nav_today", icon: MapPin },
  { href: "/history", labelKey: "layout.nav_history", icon: Compass },
  { href: "/routes", labelKey: "layout.nav_routes", icon: Route },
  { href: "/patterns", labelKey: "layout.nav_patterns", icon: LineChart },
] as const;

const LEGEND: ReadonlyArray<{ color: string; labelKey: string }> = [
  { color: "bg-success", labelKey: "layout.legend_available" },
  { color: "bg-warning", labelKey: "layout.legend_critical" },
  { color: "bg-danger", labelKey: "layout.legend_sold_out" },
] as const;

const REPO_URL = "https://github.com/jovandyaz/machupicchu-ticket-tracker";

interface SidebarProps {
  current: string;
  lastUpdated?: string;
  locale: Locale;
  toggleLocale: Locale;
  toggleUrl: string;
}

export function Sidebar({
  current,
  lastUpdated,
  locale,
  toggleLocale,
  toggleUrl,
}: SidebarProps) {
  const { t } = useTranslation(["layout", "common"]);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const handler = () => setMobileOpen((o) => !o);
    window.addEventListener("sidebar-toggle", handler as EventListener);
    return () => window.removeEventListener("sidebar-toggle", handler as EventListener);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    if (mobileOpen) {
      setTimeout(() => firstLinkRef.current?.focus(), 50);
      window.addEventListener("keydown", onKey);
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const navClasses = useMemo(
    () =>
      cn(
        "fixed inset-y-0 left-0 z-40 flex h-dvh flex-col border-r border-border bg-surface-elevated transition-[width,transform] duration-200",
        collapsed ? "w-full md:w-16" : "w-full md:w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
      ),
    [collapsed, mobileOpen],
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={navClasses} aria-label={t("layout.aria_primary_nav")}>
        <div
          className={cn(
            "flex items-start justify-between gap-2 px-4 py-5 md:px-4",
            collapsed && "justify-center px-2",
          )}
        >
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
                {t("layout.field_log")}
              </p>
              <h1 className="mt-0.5 font-display text-sm leading-tight text-fg whitespace-pre-line">
                {t("layout.brand_title")}
              </h1>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-sm p-1 text-fg-muted transition-colors hover:bg-surface hover:text-fg"
            aria-label={collapsed ? t("layout.aria_expand") : t("layout.aria_collapse")}
            title={collapsed ? t("layout.aria_expand") : t("layout.aria_collapse")}
          >
            {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
          {SECTIONS.map(({ href: target, labelKey, icon: Icon }) => {
            const active = isActive(current, target);
            return (
              <a
                key={target}
                href={href(target)}
                ref={target === "/" ? firstLinkRef : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-3 py-2 font-mono text-xs tracking-wide transition-colors",
                  active
                    ? "bg-surface text-accent"
                    : "text-fg-muted hover:bg-surface hover:text-fg",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={14} className="shrink-0" />
                {!collapsed && <span>{t(labelKey)}</span>}
              </a>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="border-t border-border px-4 py-3">
            <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
              {t("layout.legend_label")}
            </p>
            <ul className="mt-2 space-y-1.5">
              {LEGEND.map(({ color, labelKey }) => (
                <li
                  key={labelKey}
                  className="flex items-center gap-2 font-mono text-[11px] text-fg-muted"
                >
                  <span
                    className={cn("size-2 rounded-full", color)}
                    aria-hidden="true"
                  />
                  {t(labelKey)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          className={cn(
            "border-t border-border px-4 py-3",
            collapsed && "px-2 text-center",
          )}
        >
          {collapsed ? (
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-fg-muted transition-colors hover:text-fg"
              aria-label={t("layout.aria_repo")}
            >
              <ExternalLink size={14} />
            </a>
          ) : (
            <>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-mono text-[11px] text-fg-muted transition-colors hover:text-fg"
                aria-label={t("layout.aria_repo")}
              >
                {t("common.repo")}
                <ExternalLink size={10} />
              </a>
              {lastUpdated && (
                <p className="mt-2 font-mono text-[10px] text-fg-subtle">
                  {t("common.build")} · {lastUpdated}
                </p>
              )}
              <p className="mt-2 font-mono text-[9px] tracking-[0.2em] text-fg-subtle uppercase">
                {t("common.coordinates")}
              </p>
              <div className="mt-3">
                <LanguageToggle
                  locale={locale}
                  nextLocale={toggleLocale}
                  targetUrl={toggleUrl}
                />
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
