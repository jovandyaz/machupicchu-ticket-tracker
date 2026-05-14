import { describe, expect, it } from "vitest";
import { computeTargetDates } from "./today-targets";

describe("computeTargetDates", () => {
  it("returns [D+1, D+2, D+3] in Peru time at noon UTC", () => {
    const now = new Date("2026-05-13T17:00:00Z"); // 12:00 PET
    expect(computeTargetDates(now)).toEqual([
      "2026-05-14",
      "2026-05-15",
      "2026-05-16",
    ]);
  });

  it("handles a UTC moment that maps to the previous Peru day", () => {
    const now = new Date("2026-05-14T04:00:00Z"); // 23:00 PET on 2026-05-13
    expect(computeTargetDates(now)).toEqual([
      "2026-05-14",
      "2026-05-15",
      "2026-05-16",
    ]);
  });

  it("crosses a month boundary cleanly", () => {
    const now = new Date("2026-04-29T17:00:00Z"); // 12:00 PET 2026-04-29
    expect(computeTargetDates(now)).toEqual([
      "2026-04-30",
      "2026-05-01",
      "2026-05-02",
    ]);
  });
});
