import { describe, it, expect } from "vitest";
import { parseJsonl } from "../../src/lib/data/parse";

const validLine = JSON.stringify({
  timestamp: "2026-04-12T08:30:00",
  date: "2026-04-12",
  time: "08:30:00",
  target_date: "2026-04-13",
  tickets_sold_today: 100,
  total_capacity: 1000,
  total_sold: 80,
  total_available: 920,
  routes: [
    {
      route: "Ruta 2-A: Clásico Diseñada",
      circuit: "Circuito 2 - Circuito clásico",
      capacity: 600,
      available: 520,
      sold: 80,
    },
  ],
});

describe("parseJsonl", () => {
  it("parses multiple valid lines", () => {
    const result = parseJsonl([validLine, validLine].join("\n"));
    expect(result).toHaveLength(2);
    expect(result[0]?.total_sold).toBe(80);
  });

  it("ignores empty lines and trailing newline", () => {
    const result = parseJsonl(`${validLine}\n\n${validLine}\n`);
    expect(result).toHaveLength(2);
  });

  it("throws with line number on malformed JSON", () => {
    expect(() => parseJsonl(`${validLine}\nnot-json`)).toThrow(/line 2/);
  });

  it("throws on schema mismatch", () => {
    const bad = JSON.stringify({
      ...JSON.parse(validLine),
      total_sold: "oops",
    });
    expect(() => parseJsonl(bad)).toThrow();
  });

  it("accepts null tickets_sold_today", () => {
    const withNull = JSON.stringify({
      ...JSON.parse(validLine),
      tickets_sold_today: null,
    });
    expect(parseJsonl(withNull)[0]?.tickets_sold_today).toBeNull();
  });
});
