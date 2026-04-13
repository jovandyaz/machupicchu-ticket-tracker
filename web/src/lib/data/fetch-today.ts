import type { Reading } from "@/lib/types/record";
import { buildReadingsUrl, fetchReadings } from "./fetch-readings";

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
  return buildReadingsUrl(formatPeruDate(date));
}

export async function fetchToday(date: Date = new Date()): Promise<Reading[]> {
  return fetchReadings(formatPeruDate(date));
}
