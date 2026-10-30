import { describe, expect, it } from "vitest";
import type { PriceTier } from "../types/PlanType.js";
import { tierHasPositivePrice } from "./tierHasPositivePrice.js";

const tier = (overrides: Partial<PriceTier> = {}): PriceTier => ({
  ...overrides,
});

describe("tierHasPositivePrice", () => {
  it("is true when the flat price is positive", () => {
    expect(tierHasPositivePrice(tier({ flatPrice: { amount: "5.00" } }))).toBe(
      true,
    );
  });

  it("is true when the unit price is positive", () => {
    expect(tierHasPositivePrice(tier({ unitPrice: { amount: "0.01" } }))).toBe(
      true,
    );
  });

  it("is false when both parts are zero", () => {
    expect(
      tierHasPositivePrice(
        tier({ flatPrice: { amount: "0" }, unitPrice: { amount: "0.00" } }),
      ),
    ).toBe(false);
  });

  it("is false when both parts are absent (an 'Included' tier)", () => {
    expect(tierHasPositivePrice(tier())).toBe(false);
  });
});
