import { describe, expect, it } from "vitest";
import { formatDuration, formatDurationInterval } from "./formatDuration.js";

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

  it("returns raw string for invalid input", () => {
    expect(formatDurationInterval("invalid")).toBe("invalid");
  });
});
