import { describe, expect, it } from "vitest";
import { isPollingActive } from "./use-today";
import type { Reading, RouteReading } from "@/lib/types/record";

function makeReading(overrides: Partial<Reading> = {}): Reading {
  const routes: RouteReading[] = [];
  return {
    timestamp: "2026-04-12T17:00:00-05:00",
    date: "2026-04-12",
    time: "17:00:00",
    target_date: "2026-04-13",
    tickets_sold_today: null,
    total_capacity: 1000,
    total_sold: 500,
    total_available: 500,
    routes,
    ...overrides,
  };
}

/**
 * The Peru-time window is [05:00, 22:00). These UTC moments map to Peru
 * (UTC-5) times used below.
 */
const UTC_NOON_PERU = new Date("2026-04-12T17:00:00Z"); // 12:00 PET
const UTC_OVERNIGHT_PERU = new Date("2026-04-12T04:00:00Z"); // 23:00 PET prev day
const UTC_EARLY_MORNING_PERU = new Date("2026-04-12T08:00:00Z"); // 03:00 PET

describe("isPollingActive", () => {
  it("returns true during office hours with available tickets", () => {
    expect(isPollingActive([makeReading()], UTC_NOON_PERU)).toBe(true);
  });

  it("returns false overnight (22:00-05:00 PET)", () => {
    expect(isPollingActive([makeReading()], UTC_OVERNIGHT_PERU)).toBe(false);
    expect(isPollingActive([makeReading()], UTC_EARLY_MORNING_PERU)).toBe(
      false,
    );
  });

  it("returns false once sold out", () => {
    const soldOut = makeReading({ total_available: 0, total_sold: 1000 });
    expect(isPollingActive([soldOut], UTC_NOON_PERU)).toBe(false);
  });

  it("returns true when data is undefined or empty during office hours", () => {
    expect(isPollingActive(undefined, UTC_NOON_PERU)).toBe(true);
    expect(isPollingActive([], UTC_NOON_PERU)).toBe(true);
  });
});
