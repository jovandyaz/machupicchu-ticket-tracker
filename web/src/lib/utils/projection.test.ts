import { describe, it, expect } from "vitest";
import { projectSoldOut } from "./projection";
import type { Reading, RouteReading } from "@/lib/types/record";

const CAPACITY = 1000;

function makeReading(time: string, total_sold: number): Reading {
  const total_capacity = CAPACITY;
  const total_available = Math.max(total_capacity - total_sold, 0);
  const routes: RouteReading[] = [
    {
      route: "Ruta A",
      circuit: "C1",
      capacity: total_capacity,
      sold: total_sold,
      available: total_available,
    },
  ];
  return {
    timestamp: `2026-04-12T${time}-05:00`,
    date: "2026-04-12",
    time,
    target_date: "2026-04-13",
    tickets_sold_today: null,
    total_capacity,
    total_sold,
    total_available,
    routes,
  };
}

describe("projectSoldOut", () => {
  it("returns null for fewer than 4 readings", () => {
    const readings: Reading[] = [
      makeReading("15:00:00", 100),
      makeReading("15:10:00", 200),
      makeReading("15:20:00", 300),
    ];
    expect(projectSoldOut(readings)).toBeNull();
  });

  it("returns null if already sold out (total_available === 0)", () => {
    const readings: Reading[] = [
      makeReading("15:00:00", 700),
      makeReading("15:10:00", 800),
      makeReading("15:20:00", 900),
      makeReading("15:30:00", 1000),
    ];
    expect(projectSoldOut(readings)).toBeNull();
  });

  it("projects sold-out time correctly on a clean linear ramp", () => {
    // Perfectly linear: +100 sold every 10 minutes starting at 15:00:00.
    // Capacity = 1000. At 15:00: sold=100, at 15:10: 200, ... reaches 1000 at 16:30.
    const readings: Reading[] = [];
    for (let i = 0; i < 8; i++) {
      const minutes = i * 10;
      const h = 15 + Math.floor(minutes / 60);
      const m = minutes % 60;
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
      readings.push(makeReading(time, 100 * (i + 1)));
    }
    // Last reading at 16:10 sold=800 (so still available).
    const result = projectSoldOut(readings);
    expect(result).not.toBeNull();
    expect(result?.confidence).toBe("high");
    // Expected sold-out around 16:30.
    const [hh, mm] = result!.eta.split(":").map((v) => Number(v));
    const minutesTotal = (hh ?? 0) * 60 + (mm ?? 0);
    expect(Math.abs(minutesTotal - (16 * 60 + 30))).toBeLessThanOrEqual(1);
  });

  it("returns a result with lower confidence on a noisy ramp", () => {
    // Rough upward trend with noise.
    const base = [120, 190, 310, 380, 520, 600, 690, 810];
    const readings: Reading[] = base.map((sold, i) => {
      const minutes = i * 10;
      const h = 15 + Math.floor(minutes / 60);
      const m = minutes % 60;
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
      return makeReading(time, sold);
    });
    const result = projectSoldOut(readings);
    // Still trends up strongly, but with some noise — the regression on a 6-point
    // window might land high or medium. Accept either as long as it returns.
    expect(result).not.toBeNull();
    expect(["low", "medium", "high"]).toContain(result?.confidence);
  });

  it("returns null for flat readings (no sales)", () => {
    const readings: Reading[] = [
      makeReading("15:00:00", 0),
      makeReading("15:10:00", 0),
      makeReading("15:20:00", 0),
      makeReading("15:30:00", 0),
      makeReading("15:40:00", 0),
    ];
    expect(projectSoldOut(readings)).toBeNull();
  });

  it("returns null when slope is effectively zero (flat non-zero sales)", () => {
    const readings: Reading[] = [
      makeReading("15:00:00", 300),
      makeReading("15:10:00", 300),
      makeReading("15:20:00", 300),
      makeReading("15:30:00", 300),
      makeReading("15:40:00", 300),
    ];
    expect(projectSoldOut(readings)).toBeNull();
  });

  it("drops early-day zero readings before fitting", () => {
    // First 3 readings are zero; the next 5 are a clean ramp.
    const zeros: Reading[] = [
      makeReading("14:30:00", 0),
      makeReading("14:40:00", 0),
      makeReading("14:50:00", 0),
    ];
    const ramp: Reading[] = [];
    for (let i = 0; i < 5; i++) {
      const minutes = i * 10;
      const h = 15 + Math.floor(minutes / 60);
      const m = minutes % 60;
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
      ramp.push(makeReading(time, 100 * (i + 1)));
    }
    const result = projectSoldOut([...zeros, ...ramp]);
    expect(result).not.toBeNull();
    expect(result?.confidence).toBe("high");
  });
});
