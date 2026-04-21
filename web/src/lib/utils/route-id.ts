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

export function shortRouteName(route: string): string {
  const match = route.match(/Ruta\s+([0-9]+-[AB])/i);
  return match ? match[1]! : route;
}

export function shortCircuitName(circuit: string): string {
  const afterDash = circuit.split(" - ")[1];
  if (!afterDash) return circuit;
  const cleaned = afterDash.replace(/^(circuito|machupicchu)\s+/i, "");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
