import { describe, expect, it } from "vitest";
import { formatPrice, formatPriceTwoDecimals } from "./formatPrice.js";

describe("formatPrice", () => {
  it("formats whole numbers without decimals", () => {
    expect(formatPrice(10, "USD")).toBe("$10");
  });

  it("formats two decimal places for standard amounts", () => {
    expect(formatPrice(0.01, "USD")).toBe("$0.01");
    expect(formatPrice(9.99, "USD")).toBe("$9.99");
  });

  it("preserves extra decimal places beyond two", () => {
    expect(formatPrice(0.005, "USD")).toBe("$0.005");
    expect(formatPrice(0.001, "USD")).toBe("$0.001");
  });

  it("formats zero without decimals", () => {
    expect(formatPrice(0, "USD")).toBe("$0");
  });

  it("defaults to USD when no currency is provided", () => {
    expect(formatPrice(10)).toBe("$10");
  });
});

describe("formatPriceTwoDecimals", () => {
  it("interprets amount as cents", () => {
    expect(formatPriceTwoDecimals(420, "USD")).toBe("$4.20");
    expect(formatPriceTwoDecimals(100_000, "USD")).toBe("$1,000.00");
  });

  it("rounds minor units to two decimal places in the major currency", () => {
    expect(formatPriceTwoDecimals(1012.6, "USD")).toBe("$10.13");
    expect(formatPriceTwoDecimals(0.5, "USD")).toBe("$0.01");
  });

  it("defaults to USD when no currency is provided", () => {
    expect(formatPriceTwoDecimals(0)).toBe("$0.00");
  });
});
