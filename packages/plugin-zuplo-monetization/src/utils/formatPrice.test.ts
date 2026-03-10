import { describe, expect, it } from "vitest";
import { formatPrice } from "./formatPrice.js";

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
