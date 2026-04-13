import { BASE_URL } from "@/lib/utils/url";
import { defaultLocale, locales, type Locale } from "./config";

const BASE = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
const LOCALE_SEGMENT = new RegExp(`^/(?:${locales.join("|")})(?=/|$)`);

function stripBase(pathname: string): string {
  if (BASE && pathname.startsWith(BASE)) {
    const rest = pathname.slice(BASE.length);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

/** Remove a leading non-default locale segment (operates on base-stripped paths). */
export function stripLocalePath(pathname: string): string {
  const stripped = pathname.replace(LOCALE_SEGMENT, "");
  return stripped === "" ? "/" : stripped;
}

/** Build a URL pathname (base + locale prefix) for a base-stripped path. */
export function withLocale(basePath: string, locale: Locale): string {
  const normalized = basePath.startsWith("/") ? basePath : `/${basePath}`;
  const localePrefix = locale === defaultLocale ? "" : `/${locale}`;
  const joined = `${BASE}${localePrefix}${normalized}`;
  return joined === "" ? "/" : joined;
}

export function buildHreflang(
  url: URL,
): Array<{ lang: Locale; href: string }> {
  const basePath = stripLocalePath(stripBase(url.pathname));
  return locales.map((lang) => ({
    lang,
    href: new URL(withLocale(basePath, lang), url.origin).href,
  }));
}
