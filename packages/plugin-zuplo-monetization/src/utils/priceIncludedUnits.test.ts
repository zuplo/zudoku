import { describe, expect, it } from "vitest";
import { priceIncludedUnits } from "./priceIncludedUnits.js";

describe("priceIncludedUnits", () => {
  it("returns 0 when every unit is billed (single open tier with a unit price)", () => {
    expect(
      priceIncludedUnits({
        type: "tiered",
        mode: "graduated",
        tiers: [{ flatPrice: { amount: "3" }, unitPrice: { amount: "0.01" } }],
      }),
    ).toBe(0);
  });

  it("returns the free leading tier's bound (free-tier plan shape)", () => {
    expect(
      priceIncludedUnits({
        type: "tiered",
        mode: "graduated",
        tiers: [
          {
            upToAmount: "10000",
            unitPrice: { amount: "0" },
            flatPrice: { amount: "0" },
          },
          { unitPrice: { amount: "0.01" } },
        ],
      }),
    ).toBe(10000);
  });

  it("first-tier flats don't make units paid; later-tier flats do", () => {
    expect(
      priceIncludedUnits({
        type: "tiered",
        mode: "graduated",
        tiers: [
          {
            upToAmount: "500",
            unitPrice: { amount: "0" },
            flatPrice: { amount: "3" },
          },
          { unitPrice: { amount: "0" }, flatPrice: { amount: "50" } },
        ],
      }),
    ).toBe(500);
  });

  it("returns Infinity for open-ended free ranges and $0 unit prices", () => {
    expect(
      priceIncludedUnits({
        type: "tiered",
        mode: "graduated",
        tiers: [{ unitPrice: { amount: "0" } }],
      }),
    ).toBe(Number.POSITIVE_INFINITY);
    expect(priceIncludedUnits({ type: "unit", amount: "0" })).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  it("is conservative for unit, volume, package/dynamic and missing prices", () => {
    expect(priceIncludedUnits({ type: "unit", amount: "0.01" })).toBe(0);
    expect(priceIncludedUnits({ type: "unit" })).toBe(0);
    expect(
      priceIncludedUnits({
        type: "tiered",
        mode: "volume",
        tiers: [{ upToAmount: "100", unitPrice: { amount: "0" } }],
      }),
    ).toBe(0);
    expect(priceIncludedUnits({ type: "package", amount: "10" })).toBe(0);
    expect(priceIncludedUnits(undefined)).toBe(0);
    expect(priceIncludedUnits(null)).toBe(0);
  });
});
