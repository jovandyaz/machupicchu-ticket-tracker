import { describe, expect, it } from "vitest";
import type { DailySummary } from "@/lib/types/aggregates";
import {
  allZero,
  argmaxNonZero,
  bucketFor,
  buildHeatmapGrid,
  parseIsoDate,
  shortWeekday,
  topMonth,
  topRoute,
  weekdayLabel,
  weekdayOf,
} from "./aggregations";

function makeSummary(overrides: Partial<DailySummary> = {}): DailySummary {
  return {
    date: "2026-04-13",
    target_date: "2026-04-13",
    total_sold: 0,
    total_capacity: 1000,
    by_route: {},
    ...overrides,
  };
}

describe("bucketFor", () => {
  it("returns empty when no summary", () => {
    expect(bucketFor(undefined)).toBe("empty");
  });

  it("returns empty when capacity is 0", () => {
    expect(bucketFor(makeSummary({ total_capacity: 0 }))).toBe("empty");
  });

  it("returns low for 0..25%", () => {
    expect(bucketFor(makeSummary({ total_sold: 0 }))).toBe("low");
    expect(bucketFor(makeSummary({ total_sold: 249 }))).toBe("low");
  });

  it("returns mid for 25..50%", () => {
    expect(bucketFor(makeSummary({ total_sold: 250 }))).toBe("mid");
    expect(bucketFor(makeSummary({ total_sold: 499 }))).toBe("mid");
  });

  it("returns high for 50..75%", () => {
    expect(bucketFor(makeSummary({ total_sold: 500 }))).toBe("high");
    expect(bucketFor(makeSummary({ total_sold: 749 }))).toBe("high");
  });

  it("returns peak for 75..100%", () => {
    expect(bucketFor(makeSummary({ total_sold: 750 }))).toBe("peak");
    expect(bucketFor(makeSummary({ total_sold: 999 }))).toBe("peak");
  });

  it("returns sold-out when sold_out_time is present", () => {
    expect(
      bucketFor(makeSummary({ total_sold: 100, sold_out_time: "14:00:00" })),
    ).toBe("sold-out");
  });

  it("returns sold-out when pct >= 1", () => {
    expect(bucketFor(makeSummary({ total_sold: 1000 }))).toBe("sold-out");
  });
});

describe("topRoute", () => {
  it("returns the top selling route", () => {
    const s = makeSummary({
      by_route: { a: 10, b: 50, c: 20 },
    });
    expect(topRoute(s)).toEqual({ route: "b", sold: 50 });
  });

  it("returns null when by_route is empty", () => {
    expect(topRoute(makeSummary({ by_route: {} }))).toBeNull();
  });
});

describe("argmaxNonZero", () => {
  it("returns -1 for empty array", () => {
    expect(argmaxNonZero([])).toBe(-1);
  });

  it("returns -1 when all zero", () => {
    expect(argmaxNonZero([0, 0, 0])).toBe(-1);
  });

  it("returns argmax index", () => {
    expect(argmaxNonZero([0, 5, 10, 3])).toBe(2);
  });

  it("returns first index on tie", () => {
    expect(argmaxNonZero([5, 10, 10, 3])).toBe(1);
  });
});

describe("weekdayLabel / shortWeekday", () => {
  it("maps sunday to Domingo / Dom", () => {
    expect(weekdayLabel(0)).toBe("Domingo");
    expect(shortWeekday(0)).toBe("Dom");
  });
  it("maps saturday to Sábado / Sáb", () => {
    expect(weekdayLabel(6)).toBe("Sábado");
    expect(shortWeekday(6)).toBe("Sáb");
  });
  it("returns placeholder for out-of-range", () => {
    expect(weekdayLabel(9)).toBe("—");
    expect(shortWeekday(-1)).toBe("—");
  });
});

describe("topMonth", () => {
  it("returns null for empty map", () => {
    expect(topMonth({})).toBeNull();
  });

  it("returns null when all values are zero", () => {
    expect(topMonth({ "2026-04": 0 })).toBeNull();
  });

  it("picks the month with highest occupancy", () => {
    expect(
      topMonth({ "2026-04": 0.3, "2026-05": 0.8, "2026-06": 0.42 }),
    ).toEqual({ month: "2026-05", occupancy: 0.8 });
  });
});

describe("allZero", () => {
  it("returns true for empty array", () => {
    expect(allZero([])).toBe(true);
  });
  it("returns true when all values are zero", () => {
    expect(allZero([0, 0, 0])).toBe(true);
  });
  it("returns false otherwise", () => {
    expect(allZero([0, 1, 0])).toBe(false);
  });
});

describe("parseIsoDate / weekdayOf", () => {
  it("parses YYYY-MM-DD as UTC midnight", () => {
    const d = parseIsoDate("2026-04-13");
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(3);
    expect(d.getUTCDate()).toBe(13);
    expect(d.getUTCHours()).toBe(0);
  });

  it("computes weekdayOf correctly (2026-04-13 is Monday)", () => {
    expect(weekdayOf("2026-04-13")).toBe(1);
  });
});

describe("buildHeatmapGrid", () => {
  it("produces cells for every day in the window, aligned to Sunday start", () => {
    const summaries: DailySummary[] = [
      makeSummary({ date: "2026-04-13", total_sold: 423 }),
    ];
    const cells = buildHeatmapGrid(
      summaries,
      parseIsoDate("2026-04-15"),
      1,
    );

    // First cell should be a Sunday (weekday 0).
    expect(cells[0]?.weekday).toBe(0);
    // Every summary date must be matched.
    const withData = cells.filter((c) => c.summary !== undefined);
    expect(withData).toHaveLength(1);
    expect(withData[0]?.summary?.total_sold).toBe(423);
  });

  it("increments weekIndex on Sundays", () => {
    const cells = buildHeatmapGrid(
      [],
      parseIsoDate("2026-04-20"),
      1,
    );
    const weeks = new Set(cells.map((c) => c.weekIndex));
    expect(weeks.size).toBeGreaterThan(1);
  });
});
