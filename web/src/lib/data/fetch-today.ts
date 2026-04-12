import type { Reading } from "@/lib/types/record";
import { parseJsonl } from "./parse";

const REPO = "jovandyaz/machupicchu-ticket-tracker";

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function getPeruDate(now: Date = new Date()): Date {
  return new Date(now.getTime() - 5 * 60 * 60 * 1000);
}

export function getPeruHour(now: Date = new Date()): number {
  return getPeruDate(now).getUTCHours();
}

export function formatPeruDate(date: Date): string {
  const peru = getPeruDate(date);
  return `${peru.getUTCFullYear()}-${pad2(peru.getUTCMonth() + 1)}-${pad2(peru.getUTCDate())}`;
}

export function buildTodayUrl(date: Date = new Date()): string {
  const peru = getPeruDate(date);
  const y = peru.getUTCFullYear();
  const m = pad2(peru.getUTCMonth() + 1);
  const d = pad2(peru.getUTCDate());
  return `https://raw.githubusercontent.com/${REPO}/main/data/${y}/${m}/${y}-${m}-${d}.jsonl`;
}

export async function fetchToday(date: Date = new Date()): Promise<Reading[]> {
  const url = buildTodayUrl(date);
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch today's data: ${res.status}`);
  }
  const raw = await res.text();
  return parseJsonl(raw);
}
