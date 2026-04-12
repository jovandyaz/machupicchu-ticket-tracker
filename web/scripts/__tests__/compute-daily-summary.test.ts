import { describe, it, expect } from "vitest";
import { computeDailySummary } from "../build-data";
import type { Reading } from "../../src/lib/types/record";

function makeReading(overrides: Partial<Reading> & { time: string }): Reading {
  const routes = overrides.routes ?? [
    {
      route: "Ruta 2-A: Clásico Diseñada",
      circuit: "Circuito 2 - Circuito clásico",
      capacity: 600,
      available: 600 - (overrides.total_sold ?? 0),
      sold: overrides.total_sold ?? 0,
    },
  ];
  return {
    timestamp: `2026-04-12T${overrides.time}`,
    date: "2026-04-12",
    target_date: "2026-04-13",
    tickets_sold_today: null,
    total_capacity: 1000,
    total_sold: 0,
    total_available: 1000,
    routes,
    ...overrides,
  };
}

describe("computeDailySummary", () => {
  it("returns null for empty readings", () => {
    expect(computeDailySummary([])).toBeNull();
  });

  it("computes final total_sold and by_route from the last reading", () => {
    const readings: Reading[] = [
      makeReading({
        time: "06:00:00",
        total_sold: 0,
        total_available: 1000,
        routes: [
          {
            route: "Ruta A",
            circuit: "C1",
            capacity: 600,
            available: 600,
            sold: 0,
          },
          {
            route: "Ruta B",
            circuit: "C2",
            capacity: 400,
            available: 400,
            sold: 0,
          },
        ],
      }),
      makeReading({
        time: "10:00:00",
        total_sold: 700,
        total_available: 300,
        routes: [
          {
            route: "Ruta A",
            circuit: "C1",
            capacity: 600,
            available: 100,
            sold: 500,
          },
          {
            route: "Ruta B",
            circuit: "C2",
            capacity: 400,
            available: 200,
            sold: 200,
          },
        ],
      }),
    ];
    const summary = computeDailySummary(readings);
    expect(summary).not.toBeNull();
    expect(summary?.total_sold).toBe(700);
    expect(summary?.total_capacity).toBe(1000);
    expect(summary?.date).toBe("2026-04-13");
    expect(summary?.target_date).toBe("2026-04-13");
    expect(summary?.by_route).toEqual({ "Ruta A": 500, "Ruta B": 200 });
  });

  it("sets sold_out_time to the first reading where total_available is 0", () => {
    const readings: Reading[] = [
      makeReading({ time: "06:00:00", total_sold: 0, total_available: 1000 }),
      makeReading({ time: "08:00:00", total_sold: 500, total_available: 500 }),
      makeReading({ time: "09:30:00", total_sold: 1000, total_available: 0 }),
      makeReading({ time: "10:00:00", total_sold: 1000, total_available: 0 }),
    ];
    const summary = computeDailySummary(readings);
    expect(summary?.sold_out_time).toBe("09:30:00");
  });

  it("computes peak_hour from the largest delta bucket", () => {
    const readings: Reading[] = [
      makeReading({ time: "06:00:00", total_sold: 0, total_available: 1000 }),
      makeReading({ time: "07:00:00", total_sold: 10, total_available: 990 }),
      makeReading({ time: "09:00:00", total_sold: 100, total_available: 900 }),
    ];
    const summary = computeDailySummary(readings);
    expect(summary?.peak_hour).toBe(9);
  });

  it("sets first_reading to the time of the first reading with total_sold > 0", () => {
    const readings: Reading[] = [
      makeReading({ time: "05:00:00", total_sold: 0, total_available: 1000 }),
      makeReading({ time: "06:30:00", total_sold: 0, total_available: 1000 }),
      makeReading({ time: "07:15:00", total_sold: 25, total_available: 975 }),
      makeReading({ time: "08:00:00", total_sold: 100, total_available: 900 }),
    ];
    const summary = computeDailySummary(readings);
    expect(summary?.first_reading).toBe("07:15:00");
  });

  it("sorts readings by time so output is order-independent", () => {
    const r1 = makeReading({
      time: "06:00:00",
      total_sold: 0,
      total_available: 1000,
    });
    const r2 = makeReading({
      time: "09:00:00",
      total_sold: 500,
      total_available: 500,
    });
    const r3 = makeReading({
      time: "12:00:00",
      total_sold: 1000,
      total_available: 0,
      routes: [
        {
          route: "Ruta A",
          circuit: "C1",
          capacity: 1000,
          available: 0,
          sold: 1000,
        },
      ],
    });
    const shuffled: Reading[] = [r3, r1, r2];
    const summary = computeDailySummary(shuffled);
    expect(summary?.total_sold).toBe(1000);
    expect(summary?.sold_out_time).toBe("12:00:00");
    expect(summary?.by_route).toEqual({ "Ruta A": 1000 });
  });

  it("returns undefined peak_hour when all deltas are 0", () => {
    const readings: Reading[] = [
      makeReading({ time: "06:00:00", total_sold: 0, total_available: 1000 }),
      makeReading({ time: "07:00:00", total_sold: 0, total_available: 1000 }),
    ];
    const summary = computeDailySummary(readings);
    expect(summary?.peak_hour).toBeUndefined();
  });

  it("leaves sold_out_time and first_reading undefined when not reached", () => {
    const readings: Reading[] = [
      makeReading({ time: "06:00:00", total_sold: 0, total_available: 1000 }),
      makeReading({ time: "07:00:00", total_sold: 0, total_available: 1000 }),
    ];
    const summary = computeDailySummary(readings);
    expect(summary?.sold_out_time).toBeUndefined();
    expect(summary?.first_reading).toBeUndefined();
  });
});
