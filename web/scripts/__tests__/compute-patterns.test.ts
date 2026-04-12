import { describe, it, expect } from "vitest";
import { computePatterns } from "../build-data";
import type { Reading } from "../../src/lib/types/record";

interface Seed {
  target_date: string;
  time: string;
  total_sold: number;
  total_capacity?: number;
  total_available?: number;
}

function makeReading(seed: Seed): Reading {
  const total_capacity = seed.total_capacity ?? 1000;
  return {
    timestamp: `${seed.target_date}T${seed.time}`,
    date: seed.target_date,
    time: seed.time,
    target_date: seed.target_date,
    tickets_sold_today: null,
    total_capacity,
    total_sold: seed.total_sold,
    total_available: seed.total_available ?? total_capacity - seed.total_sold,
    routes: [
      {
        route: "Ruta A",
        circuit: "C1",
        capacity: total_capacity,
        available: (seed.total_available ?? total_capacity - seed.total_sold),
        sold: seed.total_sold,
      },
    ],
  };
}

describe("computePatterns", () => {
  it("returns zeros for empty input", () => {
    const p = computePatterns([]);
    expect(p.by_hour).toHaveLength(24);
    expect(p.by_hour.every((v) => v === 0)).toBe(true);
    expect(p.by_weekday).toHaveLength(7);
    expect(p.by_weekday.every((v) => v === 0)).toBe(true);
    expect(p.by_month).toEqual({});
  });

  it("computes by_hour with delta bucketed into end-hour of interval", () => {
    const readings: Reading[] = [
      makeReading({ target_date: "2026-04-13", time: "06:00:00", total_sold: 0 }),
      makeReading({ target_date: "2026-04-13", time: "07:00:00", total_sold: 40 }),
      makeReading({ target_date: "2026-04-13", time: "08:00:00", total_sold: 100 }),
    ];
    const p = computePatterns(readings);
    // 06->07: delta 40 bucketed into hour 7. 07->08: delta 60 bucketed into hour 8.
    expect(p.by_hour[7]).toBe(40);
    expect(p.by_hour[8]).toBe(60);
    expect(p.by_hour[6]).toBe(0);
    expect(p.by_hour[9]).toBe(0);
  });

  it("averages by_hour across multiple days", () => {
    const readings: Reading[] = [
      // Day 1: hour 7 delta = 40, hour 8 delta = 60
      makeReading({ target_date: "2026-04-13", time: "06:00:00", total_sold: 0 }),
      makeReading({ target_date: "2026-04-13", time: "07:00:00", total_sold: 40 }),
      makeReading({ target_date: "2026-04-13", time: "08:00:00", total_sold: 100 }),
      // Day 2: hour 7 delta = 20, hour 8 has no reading
      makeReading({ target_date: "2026-04-14", time: "06:00:00", total_sold: 0 }),
      makeReading({ target_date: "2026-04-14", time: "07:00:00", total_sold: 20 }),
    ];
    const p = computePatterns(readings);
    // Hour 7 appeared on 2 days with deltas 40 and 20 -> avg 30
    expect(p.by_hour[7]).toBe(30);
    // Hour 8 appeared on 1 day with delta 60 -> avg 60
    expect(p.by_hour[8]).toBe(60);
  });

  it("computes by_weekday average of final total_sold per weekday", () => {
    // 2026-04-13 = Monday (UTC), 2026-04-12 = Sunday, 2026-04-14 = Tuesday
    // getUTCDay: Sun=0, Mon=1, Tue=2
    const readings: Reading[] = [
      // Sunday 2026-04-12: final 500
      makeReading({ target_date: "2026-04-12", time: "06:00:00", total_sold: 0 }),
      makeReading({ target_date: "2026-04-12", time: "10:00:00", total_sold: 500 }),
      // Monday 2026-04-13: final 800
      makeReading({ target_date: "2026-04-13", time: "06:00:00", total_sold: 0 }),
      makeReading({ target_date: "2026-04-13", time: "10:00:00", total_sold: 800 }),
      // Another Monday 2026-04-20: final 600 -> avg for Monday = (800+600)/2 = 700
      makeReading({ target_date: "2026-04-20", time: "06:00:00", total_sold: 0 }),
      makeReading({ target_date: "2026-04-20", time: "10:00:00", total_sold: 600 }),
    ];
    const p = computePatterns(readings);
    expect(p.by_weekday[0]).toBe(500); // Sunday
    expect(p.by_weekday[1]).toBe(700); // Monday avg
    expect(p.by_weekday[2]).toBe(0); // Tuesday untouched
  });

  it("computes by_month average of final occupancy", () => {
    const readings: Reading[] = [
      // April: two days with occupancies 0.5 and 0.8 -> avg 0.65
      makeReading({
        target_date: "2026-04-13",
        time: "06:00:00",
        total_sold: 0,
      }),
      makeReading({
        target_date: "2026-04-13",
        time: "10:00:00",
        total_sold: 500,
        total_capacity: 1000,
      }),
      makeReading({
        target_date: "2026-04-14",
        time: "06:00:00",
        total_sold: 0,
      }),
      makeReading({
        target_date: "2026-04-14",
        time: "10:00:00",
        total_sold: 800,
        total_capacity: 1000,
      }),
      // May: one day with occupancy 1.0
      makeReading({
        target_date: "2026-05-01",
        time: "06:00:00",
        total_sold: 0,
      }),
      makeReading({
        target_date: "2026-05-01",
        time: "10:00:00",
        total_sold: 1000,
        total_capacity: 1000,
      }),
    ];
    const p = computePatterns(readings);
    expect(p.by_month["2026-04"]).toBeCloseTo(0.65, 5);
    expect(p.by_month["2026-05"]).toBe(1);
  });
});
