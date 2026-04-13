import type { MiddlewareHandler } from "astro";
import {
  defaultLocale,
  locales,
  overrideCookie,
  type Locale,
} from "@/i18n/config";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const ASSET_PREFIXES = ["/_astro", "/public"] as const;

function hasOverride(request: Request, url: URL): boolean {
  if (url.searchParams.has("lang")) return true;
  return request.headers.get("cookie")?.includes(`${overrideCookie}=`) ?? false;
}

/**
 * Parse the best locale from an Accept-Language header, honoring q-values.
 * Returns null if no supported locale matches.
 */
function pickAcceptedLocale(header: string): Locale | null {
  const ranked = header
    .split(",")
    .map((part) => {
      const [rawTag, ...params] = part.trim().split(";");
      const tag = (rawTag ?? "").toLowerCase();
      const qPart = params.find((p) => p.trim().startsWith("q="));
      const q = qPart ? Number.parseFloat(qPart.split("=")[1] ?? "1") : 1;
      return { tag, q: Number.isFinite(q) ? q : 0 };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const primary = tag.split("-")[0];
    const match = locales.find((l) => l === primary);
    if (match) return match;
  }
  return null;
}

function isLocalePath(pathname: string): boolean {
  return locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
}

function isAssetPath(pathname: string): boolean {
  return ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const onRequest: MiddlewareHandler = (context, next) => {
  const { request, url } = context;

  if (isLocalePath(url.pathname) || isAssetPath(url.pathname)) {
    return next();
  }

  // Root path: redirect to the preferred locale (only when no override set).
  if (url.pathname === "/" && !hasOverride(request, url)) {
    const preferred = pickAcceptedLocale(
      request.headers.get("accept-language") ?? "",
    );
    if (preferred && preferred !== defaultLocale) {
      const target = new URL(url);
      target.pathname = `/${preferred}`;
      return Response.redirect(target, 302);
    }
  }

  // Explicit ?lang= override: persist cookie and redirect to the prefixed route.
  const langParam = url.searchParams.get("lang");
  if (
    langParam &&
    (locales as readonly string[]).includes(langParam)
  ) {
    const locale = langParam as Locale;
    const target = new URL(url);
    target.searchParams.delete("lang");
    target.pathname = locale === defaultLocale ? "/" : `/${locale}`;
    const response = Response.redirect(target, 302);
    response.headers.append(
      "Set-Cookie",
      `${overrideCookie}=${locale}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`,
    );
    return response;
  }

  return next();
};
