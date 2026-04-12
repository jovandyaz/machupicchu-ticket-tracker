/**
 * Route-id helpers. The two slug styles serve different purposes:
 *
 * - `routeVarKey`: used as the key half of CSS custom-property names (e.g.
 *   `--color-ruta_1_a`). Underscores keep it CSS-identifier safe while not
 *   clashing with the hyphens in the file-slug form.
 * - `routeFileSlug`: used for filenames (e.g. `ruta-1-a.json`). Strips
 *   diacritics and collapses to hyphens.
 */

export function routeVarKey(route: string): string {
  return route
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function routeFileSlug(route: string): string {
  return route
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "Ruta 1-A: Montaña Machupicchu" → "1-A". Falls back to the full name. */
export function shortRouteName(route: string): string {
  const match = route.match(/Ruta\s+([0-9]+-[AB])/i);
  return match ? match[1]! : route;
}
