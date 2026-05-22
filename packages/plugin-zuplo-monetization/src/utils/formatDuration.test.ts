import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatDurationAdjective,
  formatDurationInterval,
} from "./formatDuration.js";

describe("formatDuration", () => {
  it("returns 'month' for P1M", () => {
    expect(formatDuration("P1M")).toBe("month");
  });

  it("returns '3 months' for P3M", () => {
    expect(formatDuration("P3M")).toBe("3 months");
  });

  it("returns 'year' for P1Y", () => {
    expect(formatDuration("P1Y")).toBe("year");
  });

  it("returns '2 years' for P2Y", () => {
    expect(formatDuration("P2Y")).toBe("2 years");
  });

  it("returns 'week' for P1W", () => {
    expect(formatDuration("P1W")).toBe("week");
  });

  it("returns '2 weeks' for P2W", () => {
    expect(formatDuration("P2W")).toBe("2 weeks");
  });

  it("returns 'day' for P1D", () => {
    expect(formatDuration("P1D")).toBe("day");
  });

  it("returns '5 days' for P5D", () => {
    expect(formatDuration("P5D")).toBe("5 days");
  });

  it("returns 'hour' for PT1H", () => {
    expect(formatDuration("PT1H")).toBe("hour");
  });

  it("returns '4 hours' for PT4H", () => {
    expect(formatDuration("PT4H")).toBe("4 hours");
  });

  it("returns 'minute' for PT1M", () => {
    expect(formatDuration("PT1M")).toBe("minute");
  });

  it("returns '15 minutes' for PT15M", () => {
    expect(formatDuration("PT15M")).toBe("15 minutes");
  });

  it("returns 'second' for PT1S", () => {
    expect(formatDuration("PT1S")).toBe("second");
  });

  it("returns '30 seconds' for PT30S", () => {
    expect(formatDuration("PT30S")).toBe("30 seconds");
  });

  it("returns raw string for invalid input", () => {
    expect(formatDuration("not-a-duration")).toBe("not-a-duration");
  });
});

describe("formatDurationInterval", () => {
  it("returns 'monthly' for P1M", () => {
    expect(formatDurationInterval("P1M")).toBe("monthly");
  });

  it("returns 'every 3 months' for P3M", () => {
    expect(formatDurationInterval("P3M")).toBe("every 3 months");
  });

  it("returns 'yearly' for P1Y", () => {
    expect(formatDurationInterval("P1Y")).toBe("yearly");
  });

  it("returns 'every 2 years' for P2Y", () => {
    expect(formatDurationInterval("P2Y")).toBe("every 2 years");
  });

  it("returns 'weekly' for P1W", () => {
    expect(formatDurationInterval("P1W")).toBe("weekly");
  });

  it("returns 'every 2 weeks' for P2W", () => {
    expect(formatDurationInterval("P2W")).toBe("every 2 weeks");
  });

  it("returns 'daily' for P1D", () => {
    expect(formatDurationInterval("P1D")).toBe("daily");
  });

  it("returns 'every 5 days' for P5D", () => {
    expect(formatDurationInterval("P5D")).toBe("every 5 days");
  });

  it("returns 'hourly' for PT1H", () => {
    expect(formatDurationInterval("PT1H")).toBe("hourly");
  });

  it("returns 'every 6 hours' for PT6H", () => {
    expect(formatDurationInterval("PT6H")).toBe("every 6 hours");
  });

  it("returns 'every minute' for PT1M", () => {
    expect(formatDurationInterval("PT1M")).toBe("every minute");
  });

  it("returns 'every 5 minutes' for PT5M", () => {
    expect(formatDurationInterval("PT5M")).toBe("every 5 minutes");
  });

  it("returns 'every second' for PT1S", () => {
    expect(formatDurationInterval("PT1S")).toBe("every second");
  });

  it("returns 'every 30 seconds' for PT30S", () => {
    expect(formatDurationInterval("PT30S")).toBe("every 30 seconds");
  });

  it("returns raw string for invalid input", () => {
    expect(formatDurationInterval("invalid")).toBe("invalid");
  });
});

describe("formatDurationAdjective", () => {
  it("returns adjective for single-unit cadences", () => {
    expect(formatDurationAdjective("P1M")).toBe("monthly");
    expect(formatDurationAdjective("P1W")).toBe("weekly");
    expect(formatDurationAdjective("P1Y")).toBe("yearly");
    expect(formatDurationAdjective("P1D")).toBe("daily");
    expect(formatDurationAdjective("PT1H")).toBe("hourly");
  });

  it("returns 'billing period' for multi-unit cadences", () => {
    expect(formatDurationAdjective("P3M")).toBe("billing period");
    expect(formatDurationAdjective("P2W")).toBe("billing period");
    expect(formatDurationAdjective("PT4H")).toBe("billing period");
  });

  it("returns 'billing period' for sub-hour cadences", () => {
    // "per-minute" / "per-second" adjectives read awkwardly in possessive
    // contexts ("your per-minute quota"); fall back to the neutral phrase.
    expect(formatDurationAdjective("PT1M")).toBe("billing period");
    expect(formatDurationAdjective("PT30S")).toBe("billing period");
  });

  it("returns 'billing period' for invalid input", () => {
    expect(formatDurationAdjective("invalid")).toBe("billing period");
  });
});
