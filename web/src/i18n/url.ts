import { BASE_URL } from "@/lib/utils/url";
import { locales } from "./config";

const BASE = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
const LOCALE_SEGMENT = new RegExp(`^/(?:${locales.join("|")})(?=/|$)`);

export function stripBase(pathname: string): string {
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

/**
 * Returns the current pathname with the locale segment removed but the base
 * retained. Useful as the `current` reference for nav-active comparisons.
 */
export function currentNavPath(pathname: string): string {
  const stripped = stripLocalePath(stripBase(pathname));
  const tail = stripped === "/" ? "/" : stripped;
  return BASE ? `${BASE}${tail}` : tail;
}
