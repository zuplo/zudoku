import { describe, expect, it } from "vitest";
import { formatBillingCycle } from "./formatBillingCycle.js";

describe("formatBillingCycle", () => {
  it("returns 'monthly' for month", () => {
    expect(formatBillingCycle("month")).toBe("monthly");
  });

  it("returns 'annually' for year", () => {
    expect(formatBillingCycle("year")).toBe("annually");
  });

  it("returns 'weekly' for week", () => {
    expect(formatBillingCycle("week")).toBe("weekly");
  });

  it("returns 'daily' for day", () => {
    expect(formatBillingCycle("day")).toBe("daily");
  });

  it("returns 'every 2 months' for plural durations", () => {
    expect(formatBillingCycle("2 months")).toBe("every 2 months");
  });

  it("returns 'every 2 weeks' for plural durations", () => {
    expect(formatBillingCycle("2 weeks")).toBe("every 2 weeks");
  });

  it("returns 'every <value>' for unknown singular durations", () => {
    expect(formatBillingCycle("quarter")).toBe("every quarter");
  });
});
