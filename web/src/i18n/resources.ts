import type { Locale } from "./config";
import enCommon from "./locales/en/common.json";
import enLayout from "./locales/en/layout.json";
import enToday from "./locales/en/today.json";
import enRoutes from "./locales/en/routes.json";
import enPatterns from "./locales/en/patterns.json";
import enHistory from "./locales/en/history.json";
import esCommon from "./locales/es/common.json";
import esLayout from "./locales/es/layout.json";
import esToday from "./locales/es/today.json";
import esRoutes from "./locales/es/routes.json";
import esPatterns from "./locales/es/patterns.json";
import esHistory from "./locales/es/history.json";

export const namespaces = [
  "common",
  "layout",
  "today",
  "routes",
  "patterns",
  "history",
] as const;

export type Namespace = (typeof namespaces)[number];

export const resources = {
  en: {
    common: enCommon,
    layout: enLayout,
    today: enToday,
    routes: enRoutes,
    patterns: enPatterns,
    history: enHistory,
  },
  es: {
    common: esCommon,
    layout: esLayout,
    today: esToday,
    routes: esRoutes,
    patterns: esPatterns,
    history: esHistory,
  },
} as const satisfies Record<Locale, Record<Namespace, Record<string, string>>>;
