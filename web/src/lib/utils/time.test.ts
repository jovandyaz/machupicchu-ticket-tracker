import { describe, expect, it } from "vitest";
import { secondsToHHMM, timeToSeconds } from "./time";

describe("timeToSeconds", () => {
  it("parses HH:MM:SS", () => {
    expect(timeToSeconds("15:30:45")).toBe(15 * 3600 + 30 * 60 + 45);
  });

  it("parses HH:MM (missing seconds default to 0)", () => {
    expect(timeToSeconds("09:05")).toBe(9 * 3600 + 5 * 60);
  });

  it("handles 00:00:00", () => {
    expect(timeToSeconds("00:00:00")).toBe(0);
  });
});

describe("secondsToHHMM", () => {
  it("formats a mid-day value", () => {
    expect(secondsToHHMM(15 * 3600 + 30 * 60)).toBe("15:30");
  });

  it("rounds seconds component", () => {
    expect(secondsToHHMM(15 * 3600 + 30 * 60 + 29)).toBe("15:30");
    expect(secondsToHHMM(15 * 3600 + 30 * 60 + 30)).toBe("15:30");
  });

  it("wraps values past midnight", () => {
    expect(secondsToHHMM(25 * 3600)).toBe("01:00");
  });

  it("wraps negative values", () => {
    expect(secondsToHHMM(-3600)).toBe("23:00");
  });
});
