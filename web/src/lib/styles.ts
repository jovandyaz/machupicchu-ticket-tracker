export const CARD_HOVER =
  "transition-[box-shadow,border-color] duration-200 hover:ring-accent/40 hover:shadow-[0_0_0_1px_rgba(212,165,55,0.2)]";

export function occupancyBarClass(pct: number): string {
  if (pct >= 100) return "[&>[data-slot=progress-indicator]]:bg-danger";
  if (pct >= 75) return "[&>[data-slot=progress-indicator]]:bg-warning";
  if (pct >= 50) return "[&>[data-slot=progress-indicator]]:bg-accent";
  return "[&>[data-slot=progress-indicator]]:bg-success";
}
