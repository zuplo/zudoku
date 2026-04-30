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

  it("omits redundant included up-to tier when omitIncludedUpToAmount matches", () => {
    const lines = formatTieredPriceBreakdown({
      tiers: [
        { upToAmount: "5000", unitPriceAmount: "0" },
        { unitPriceAmount: "0.05" },
      ],
      unitLabel: "unit",
      includedLabel: "Included",
      currency: "USD",
      omitIncludedUpToAmount: 5000,
    });

    expect(lines).toEqual(["Over 5,000: $0.05/unit"]);
  });

  it("does not omit included up-to tier when there is a base flat price", () => {
    const lines = formatTieredPriceBreakdown({
      tiers: [
        { upToAmount: "5000", unitPriceAmount: "0", flatPriceAmount: "10" },
        { unitPriceAmount: "0.05" },
      ],
      unitLabel: "unit",
      includedLabel: "Included",
      currency: "USD",
      omitIncludedUpToAmount: 5000,
    });

    expect(lines?.[0]).toMatch(/^Up to 5,000:/);
    expect(lines?.[0]).toMatch(/\$10\.00 base$/);
  });
});
