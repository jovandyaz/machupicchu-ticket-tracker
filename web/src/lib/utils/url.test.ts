import { describe, expect, it } from "vitest";
import { hrefWith, isActiveWith } from "./url";

describe("hrefWith", () => {
  it("returns root-relative path unchanged in dev (base='/')", () => {
    expect(hrefWith("/", "/history")).toBe("/history");
    expect(hrefWith("/", "/")).toBe("/");
  });

  it("prefixes with project base in prod", () => {
    expect(hrefWith("/machupicchu-ticket-tracker/", "/history"))
      .toBe("/machupicchu-ticket-tracker/history");
    expect(hrefWith("/machupicchu-ticket-tracker/", "/"))
      .toBe("/machupicchu-ticket-tracker/");
  });

  it("handles trailing-slash variants on the base", () => {
    expect(hrefWith("/machupicchu-ticket-tracker", "/routes"))
      .toBe("/machupicchu-ticket-tracker/routes");
  });

  it("ensures leading slash is added if missing on path", () => {
    expect(hrefWith("/", "patterns")).toBe("/patterns");
    expect(hrefWith("/machupicchu-ticket-tracker/", "patterns"))
      .toBe("/machupicchu-ticket-tracker/patterns");
  });

  it("handles empty base gracefully", () => {
    expect(hrefWith("", "/history")).toBe("/history");
  });
});

describe("isActiveWith", () => {
  it("matches homepage only on exact root in dev", () => {
    expect(isActiveWith("/", "/", "/")).toBe(true);
    expect(isActiveWith("/", "/history", "/")).toBe(false);
  });

  it("matches homepage in prod with or without trailing slash", () => {
    const base = "/machupicchu-ticket-tracker/";
    expect(isActiveWith(base, "/machupicchu-ticket-tracker/", "/")).toBe(true);
    expect(isActiveWith(base, "/machupicchu-ticket-tracker", "/")).toBe(true);
    expect(
      isActiveWith(base, "/machupicchu-ticket-tracker/history", "/"),
    ).toBe(false);
  });

  it("matches section in dev", () => {
    expect(isActiveWith("/", "/history", "/history")).toBe(true);
    expect(isActiveWith("/", "/history/", "/history")).toBe(true);
    expect(isActiveWith("/", "/routes", "/history")).toBe(false);
  });

  it("matches section in prod", () => {
    const base = "/machupicchu-ticket-tracker/";
    expect(
      isActiveWith(base, "/machupicchu-ticket-tracker/history", "/history"),
    ).toBe(true);
    expect(
      isActiveWith(base, "/machupicchu-ticket-tracker/history/", "/history"),
    ).toBe(true);
    expect(
      isActiveWith(base, "/machupicchu-ticket-tracker/routes", "/history"),
    ).toBe(false);
    expect(isActiveWith(base, "/machupicchu-ticket-tracker/", "/history"))
      .toBe(false);
  });
});
