import { useState } from "react";
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

interface SidebarSection {
  href: string;
  label: string;
  icon: typeof MapPin;
}

const SECTIONS: readonly SidebarSection[] = [
  { href: "/", label: "Hoy", icon: MapPin },
  { href: "/history", label: "Histórico", icon: Compass },
  { href: "/routes", label: "Rutas", icon: Route },
  { href: "/patterns", label: "Patrones", icon: LineChart },
] as const;

const LEGEND: ReadonlyArray<{ color: string; label: string }> = [
  { color: "bg-success", label: "disponible" },
  { color: "bg-warning", label: "crítico" },
  { color: "bg-danger", label: "agotado" },
] as const;

interface SidebarProps {
  current: string;
  lastUpdated?: string;
}

export function Sidebar({ current, lastUpdated }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-dvh flex-col border-r border-border bg-surface-elevated transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
      aria-label="Primary navigation"
    >
      <div
        className={cn(
          "flex items-start justify-between gap-2 px-4 py-5",
          collapsed && "justify-center px-2",
        )}
      >
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
              Field log
            </p>
            <h1 className="mt-0.5 font-display text-sm leading-tight text-fg">
              Machu Picchu
              <br />
              Ticket Tracker
            </h1>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-sm p-1 text-fg-muted transition-colors hover:bg-surface hover:text-fg"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <ChevronsRight size={14} />
          ) : (
            <ChevronsLeft size={14} />
          )}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
        {SECTIONS.map(({ href: target, label, icon: Icon }) => {
          const active = isActive(current, target);
          return (
            <a
              key={target}
              href={href(target)}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2 font-mono text-xs tracking-wide transition-colors",
                active
                  ? "bg-surface text-accent"
                  : "text-fg-muted hover:bg-surface hover:text-fg",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={14} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </a>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-border px-4 py-3">
          <p className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
            Legend
          </p>
          <ul className="mt-2 space-y-1.5">
            {LEGEND.map(({ color, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 font-mono text-[11px] text-fg-muted"
              >
                <span
                  className={cn("size-2 rounded-full", color)}
                  aria-hidden="true"
                />
                {label}
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
            href="https://github.com/jovandyaz/machupicchu-ticket-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-fg-muted transition-colors hover:text-fg"
            aria-label="View repository on GitHub"
          >
            <ExternalLink size={14} />
          </a>
        ) : (
          <>
            <a
              href="https://github.com/jovandyaz/machupicchu-ticket-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-mono text-[11px] text-fg-muted transition-colors hover:text-fg"
            >
              repo
              <ExternalLink size={10} />
            </a>
            {lastUpdated && (
              <p className="mt-2 font-mono text-[10px] text-fg-subtle">
                build · {lastUpdated}
              </p>
            )}
            <p className="mt-2 font-mono text-[9px] tracking-[0.2em] text-fg-subtle uppercase">
              13°09'48"S · 72°32'44"W
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
