import { defaultLocale, locales, type Locale } from "./config";
import { namespaces, resources, type Namespace } from "./resources";

export {
  buildHreflang,
  stripLocalePath as stripLocalePrefix,
  withLocale,
} from "./url";

function getNested(
  obj: Record<string, unknown>,
  path: string,
): string | undefined {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj) as string | undefined;
}

function format(value: string, params?: Record<string, string | number>) {
  if (!params) return value;
  return Object.entries(params).reduce(
    (acc, [key, v]) => acc.replace(`{${key}}`, String(v)),
    value,
  );
}

function normalizeLocale(locale: string): Locale {
  return (locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : defaultLocale;
}

export function getT(locale: string) {
  const normalized = normalizeLocale(locale);

  return (
    key: `${Namespace}.${string}`,
    params?: Record<string, string | number>,
  ) => {
    const [ns, ...rest] = key.split(".");
    const namespace = ns as Namespace;
    if (!(namespaces as readonly string[]).includes(namespace)) {
      return format(key, params);
    }
    const path = rest.join(".");
    const value = getNested(resources[normalized][namespace], path);
    if (value) return format(value, params);
    const fallback = getNested(resources[defaultLocale][namespace], path);
    return format(fallback ?? key, params);
  };
}
