import { describe, expect, it } from "vitest";
import { formatTieredPriceBreakdown } from "./formatTieredPriceBreakdown.js";

describe("formatTieredPriceBreakdown", () => {
  it("returns undefined for 0 or 1 tiers", () => {
    expect(
      formatTieredPriceBreakdown({
        tiers: [],
        unitLabel: "unit",
        includedLabel: "Included",
      }),
    ).toBeUndefined();

    expect(
      formatTieredPriceBreakdown({
        tiers: [{ upToAmount: "1000", unitPriceAmount: "0" }],
        unitLabel: "unit",
        includedLabel: "Included",
      }),
    ).toBeUndefined();
  });

  it("formats up-to and over tiers", () => {
    const lines = formatTieredPriceBreakdown({
      tiers: [
        { upToAmount: "5000", unitPriceAmount: "0" },
        { unitPriceAmount: "0.05" },
      ],
      unitLabel: "unit",
      includedLabel: "Included",
      currency: "USD",
    });

    expect(lines).toEqual(["Up to 5,000: Included", "Over 5,000: $0.05/unit"]);
  });

  it("renders flat price first, then unit price when both are non-zero", () => {
    const lines = formatTieredPriceBreakdown({
      tiers: [
        { upToAmount: "1000000", unitPriceAmount: "0", flatPriceAmount: "499" },
        {
          upToAmount: "2000000",
          unitPriceAmount: "0.05",
          flatPriceAmount: "199",
        },
        { unitPriceAmount: "0.02", flatPriceAmount: "0" },
      ],
      unitLabel: "unit",
      includedLabel: "Included",
      currency: "USD",
    });

    expect(lines).toEqual([
      "Up to 1,000,000: $499",
      "Up to 2,000,000: $199 + $0.05/unit",
      "Over 2,000,000: $0.02/unit",
    ]);
  });

  it("renders Included when both flat and unit prices are zero", () => {
    const lines = formatTieredPriceBreakdown({
      tiers: [
        { upToAmount: "1000", unitPriceAmount: "0", flatPriceAmount: "0" },
        { unitPriceAmount: "0.05" },
      ],
      unitLabel: "unit",
      includedLabel: "Included",
      currency: "USD",
    });

    expect(lines).toEqual(["Up to 1,000: Included", "Over 1,000: $0.05/unit"]);
  });
});
