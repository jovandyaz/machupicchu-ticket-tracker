import { describe, it, expect } from "vitest";
import { computeRouteStats } from "../build-data";
import type { Reading, RouteReading } from "../../src/lib/types/record";

interface ReadingSeed {
  target_date: string;
  time: string;
  routes: RouteReading[];
}

function makeReading(seed: ReadingSeed): Reading {
  const total_capacity = seed.routes.reduce((sum, r) => sum + r.capacity, 0);
  const total_sold = seed.routes.reduce((sum, r) => sum + r.sold, 0);
  const total_available = seed.routes.reduce((sum, r) => sum + r.available, 0);
  return {
    timestamp: `${seed.target_date}T${seed.time}`,
    date: seed.target_date,
    time: seed.time,
    target_date: seed.target_date,
    tickets_sold_today: null,
    total_capacity,
    total_sold,
    total_available,
    routes: seed.routes,
  };
}

const routeA = (available: number, sold: number): RouteReading => ({
  route: "Ruta A",
  circuit: "C1",
  capacity: 600,
  available,
  sold,
});

const routeB = (available: number, sold: number): RouteReading => ({
  route: "Ruta B",
  circuit: "C2",
  capacity: 400,
  available,
  sold,
});

describe("computeRouteStats", () => {
  it("returns empty array for empty input", () => {
    expect(computeRouteStats([])).toEqual([]);
  });

  it("computes per-route history with final sold per day", () => {
    const readings: Reading[] = [
      makeReading({
        target_date: "2026-04-13",
        time: "06:00:00",
        routes: [routeA(600, 0), routeB(400, 0)],
      }),
      makeReading({
        target_date: "2026-04-13",
        time: "10:00:00",
        routes: [routeA(100, 500), routeB(200, 200)],
      }),
    ];
    const stats = computeRouteStats(readings);
    expect(stats).toHaveLength(2);
    const a = stats.find((s) => s.route === "Ruta A")!;
    const b = stats.find((s) => s.route === "Ruta B")!;
    expect(a.history).toEqual([{ date: "2026-04-13", sold: 500 }]);
    expect(b.history).toEqual([{ date: "2026-04-13", sold: 200 }]);
    expect(a.capacity).toBe(600);
    expect(a.circuit).toBe("C1");
  });

  it("records sold_out_time per day for the first reading where available hits 0", () => {
    const readings: Reading[] = [
      makeReading({
        target_date: "2026-04-13",
        time: "06:00:00",
        routes: [routeA(600, 0)],
      }),
      makeReading({
        target_date: "2026-04-13",
        time: "08:00:00",
        routes: [routeA(0, 600)],
      }),
      makeReading({
        target_date: "2026-04-13",
        time: "09:00:00",
        routes: [routeA(0, 600)],
      }),
    ];
    const stats = computeRouteStats(readings);
    expect(stats[0]?.history[0]?.sold_out_time).toBe("08:00:00");
    expect(stats[0]?.sold_out_count).toBe(1);
  });

  it("aggregates sold_out_count, avg_occupancy and avg_velocity across days", () => {
    const readings: Reading[] = [
      // Day 1: sold out at 09:00 after starting sales at 07:00. Final sold=600.
      makeReading({
        target_date: "2026-04-13",
        time: "06:00:00",
        routes: [routeA(600, 0)],
      }),
      makeReading({
        target_date: "2026-04-13",
        time: "07:00:00",
        routes: [routeA(400, 200)],
      }),
      makeReading({
        target_date: "2026-04-13",
        time: "09:00:00",
        routes: [routeA(0, 600)],
      }),
      // Day 2: never sells out. Sales from 07:00 to 11:00. Final sold=300.
      makeReading({
        target_date: "2026-04-14",
        time: "06:00:00",
        routes: [routeA(600, 0)],
      }),
      makeReading({
        target_date: "2026-04-14",
        time: "07:00:00",
        routes: [routeA(500, 100)],
      }),
      makeReading({
        target_date: "2026-04-14",
        time: "11:00:00",
        routes: [routeA(300, 300)],
      }),
    ];
    const stats = computeRouteStats(readings);
    const a = stats[0]!;
    expect(a.sold_out_count).toBe(1);
    // avg_occupancy = (600/600 + 300/600) / 2 = (1 + 0.5) / 2 = 0.75
    expect(a.avg_occupancy).toBeCloseTo(0.75, 5);
    // Day 1 velocity: 600 sold / 2h (07:00→09:00) = 300/h
    // Day 2 velocity: 300 sold / 4h (07:00→11:00) = 75/h
    // avg = 187.5
    expect(a.avg_velocity).toBeCloseTo(187.5, 3);
    expect(a.history).toEqual([
      { date: "2026-04-13", sold: 600, sold_out_time: "09:00:00" },
      { date: "2026-04-14", sold: 300 },
    ]);
  });

  it("preserves route insertion order encountered in data", () => {
    const readings: Reading[] = [
      makeReading({
        target_date: "2026-04-13",
        time: "06:00:00",
        routes: [routeB(400, 0), routeA(600, 0)],
      }),
    ];
    const stats = computeRouteStats(readings);
    expect(stats.map((s) => s.route)).toEqual(["Ruta B", "Ruta A"]);
  });

  it("contributes 0 velocity for days with no activity", () => {
    const readings: Reading[] = [
      makeReading({
        target_date: "2026-04-13",
        time: "06:00:00",
        routes: [routeA(600, 0)],
      }),
      makeReading({
        target_date: "2026-04-13",
        time: "10:00:00",
        routes: [routeA(600, 0)],
      }),
    ];
    const stats = computeRouteStats(readings);
    expect(stats[0]?.avg_velocity).toBe(0);
    expect(stats[0]?.avg_occupancy).toBe(0);
  });
});
