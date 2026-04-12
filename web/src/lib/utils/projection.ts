import type { Reading } from "@/lib/types/record";
import { secondsToHHMM, timeToSeconds } from "./time";

export type ProjectionConfidence = "low" | "medium" | "high";

export interface SoldOutProjection {
  eta: string;
  confidence: ProjectionConfidence;
}

const WINDOW_SIZE = 6;
const MIN_READINGS = 4;

interface Point {
  t: number;
  y: number;
}

interface Fit {
  m: number;
  b: number;
  r2: number;
}

function fitLinear(points: Point[]): Fit | null {
  const n = points.length;
  if (n < 2) return null;
  let sumT = 0;
  let sumY = 0;
  for (const p of points) {
    sumT += p.t;
    sumY += p.y;
  }
  const meanT = sumT / n;
  const meanY = sumY / n;

  let num = 0;
  let den = 0;
  for (const p of points) {
    const dt = p.t - meanT;
    num += dt * (p.y - meanY);
    den += dt * dt;
  }
  if (den === 0) return null;
  const m = num / den;
  const b = meanY - m * meanT;

  // R²
  let ssRes = 0;
  let ssTot = 0;
  for (const p of points) {
    const yHat = m * p.t + b;
    ssRes += (p.y - yHat) ** 2;
    ssTot += (p.y - meanY) ** 2;
  }
  if (ssTot === 0) return null;
  const r2 = 1 - ssRes / ssTot;
  return { m, b, r2 };
}

function confidenceFor(r2: number): ProjectionConfidence | null {
  if (r2 > 0.9) return "high";
  if (r2 > 0.7) return "medium";
  if (r2 > 0.4) return "low";
  return null;
}

/**
 * Fits a linear regression over the last N readings and projects the time
 * at which `total_sold` will equal `total_capacity`. Returns null if there
 * are too few readings, the capacity is already reached, or the fit is
 * too weak to be meaningful.
 */
export function projectSoldOut(readings: Reading[]): SoldOutProjection | null {
  if (readings.length < MIN_READINGS) return null;

  const last = readings[readings.length - 1];
  if (!last) return null;
  if (last.total_available === 0) return null;
  if (last.total_capacity <= 0) return null;

  // Drop early-day zero readings (office hasn't opened / no sales yet).
  const nonZero = readings.filter((r) => r.total_sold > 0);
  if (nonZero.length < MIN_READINGS) return null;

  const window = nonZero.slice(-WINDOW_SIZE);
  const points: Point[] = window.map((r) => ({
    t: timeToSeconds(r.time),
    y: r.total_sold,
  }));

  const fit = fitLinear(points);
  if (!fit) return null;

  // Must be actively climbing.
  if (fit.m <= 0) return null;

  const confidence = confidenceFor(fit.r2);
  if (!confidence) return null;

  const targetT = (last.total_capacity - fit.b) / fit.m;
  const lastT = points[points.length - 1]!.t;
  if (!Number.isFinite(targetT) || targetT <= lastT) return null;

  return { eta: secondsToHHMM(targetT), confidence };
}
