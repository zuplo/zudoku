import { describe, expect, it } from "vitest";
import { formatMinorCurrencyAmount, formatPrice } from "./formatPrice.js";

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

describe("formatMinorCurrencyAmount", () => {
  it("uses two fraction digits and divides by 100 for USD", () => {
    expect(formatMinorCurrencyAmount(420, "USD")).toBe("$4.20");
    expect(formatMinorCurrencyAmount(100_000, "USD")).toBe("$1,000.00");
  });

  it("uses no extra fraction digits for zero-exponent currencies (e.g. JPY, KRW)", () => {
    expect(formatMinorCurrencyAmount(420, "JPY")).toBe("¥420");
    expect(formatMinorCurrencyAmount(12_500, "KRW")).toBe("₩12,500");
  });

  it("uses three fraction digits for KWD", () => {
    expect(formatMinorCurrencyAmount(12_345, "KWD")).toBe("KWD 12.345");
  });

  it("rounds when converting from minor units", () => {
    expect(formatMinorCurrencyAmount(1012.6, "USD")).toBe("$10.13");
    expect(formatMinorCurrencyAmount(0.5, "USD")).toBe("$0.01");
  });

  it("normalizes currency to uppercase", () => {
    expect(formatMinorCurrencyAmount(420, "usd")).toBe("$4.20");
  });

  it("defaults to USD when no currency is provided", () => {
    expect(formatMinorCurrencyAmount(0)).toBe("$0.00");
  });
});
