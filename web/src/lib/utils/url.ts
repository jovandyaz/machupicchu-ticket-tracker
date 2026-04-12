/**
 * URL helpers that are BASE_URL-aware.
 *
 * Astro injects `import.meta.env.BASE_URL` ("/" in dev, "/machupicchu-ticket-tracker/"
 * in prod once `base` is set in astro.config.mjs). Astro components and `<a>` tags
 * inside `.astro` files get prefixed automatically, but React islands don't —
 * so we need to prefix links manually there.
 */

/**
 * Default base URL, read from Astro's env. Exposed for the React islands that
 * need to prefix paths at runtime.
 */
export const BASE_URL: string = import.meta.env.BASE_URL;

/**
 * Prefix `path` with `base`. Pure function; accepts an explicit `base` so it's
 * trivially unit-testable without mocking `import.meta.env`.
 */
export function hrefWith(base: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (base === "/" || base === "") return normalized;
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmedBase}${normalized}`;
}

/** Prefix `path` with the current BASE_URL. */
export function href(path: string): string {
  return hrefWith(BASE_URL, path);
}

/**
 * Compare an Astro-provided `currentPath` (which already includes BASE_URL)
 * against an un-prefixed `target` nav entry.
 */
export function isActiveWith(
  base: string,
  currentPath: string,
  target: string,
): boolean {
  const fullTarget = hrefWith(base, target);
  if (target === "/") {
    // hrefWith("/machupicchu-ticket-tracker/", "/") returns
    // "/machupicchu-ticket-tracker/" — accept both with and without trailing
    // slash (Astro may redirect between them) but not deeper paths.
    const withSlash = fullTarget.endsWith("/") ? fullTarget : `${fullTarget}/`;
    const withoutSlash = fullTarget.endsWith("/")
      ? fullTarget.slice(0, -1)
      : fullTarget;
    return currentPath === withSlash || currentPath === withoutSlash;
  }
  return currentPath === fullTarget ||
    currentPath === `${fullTarget}/` ||
    currentPath.startsWith(`${fullTarget}/`);
}

/** isActive using the current BASE_URL. */
export function isActive(currentPath: string, target: string): boolean {
  return isActiveWith(BASE_URL, currentPath, target);
}
