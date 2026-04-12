import { describe, expect, it } from "vitest";
import { routeFileSlug, routeVarKey, shortRouteName } from "./route-id";

describe("routeVarKey", () => {
  it("lowercases and replaces non-alphanumerics with underscores", () => {
    expect(routeVarKey("Ruta 1-A: Montaña Machupicchu")).toBe(
      "ruta_1_a_monta_a_machupicchu",
    );
  });

  it("strips leading/trailing underscores", () => {
    expect(routeVarKey("—Ruta—")).toBe("ruta");
  });
});

describe("routeFileSlug", () => {
  it("lowercases, strips diacritics, and joins with hyphens", () => {
    expect(routeFileSlug("Ruta 1-A: Montaña Machupicchu")).toBe(
      "ruta-1-a-montana-machupicchu",
    );
  });

  it("strips leading/trailing hyphens", () => {
    expect(routeFileSlug("—Ruta—")).toBe("ruta");
  });
});

describe("shortRouteName", () => {
  it("extracts the route code", () => {
    expect(shortRouteName("Ruta 1-A: Montaña Machupicchu")).toBe("1-A");
    expect(shortRouteName("Ruta 2-B: Circuito Clásico")).toBe("2-B");
  });

  it("falls back to the original name when the pattern does not match", () => {
    expect(shortRouteName("Alternative Name")).toBe("Alternative Name");
  });
});
