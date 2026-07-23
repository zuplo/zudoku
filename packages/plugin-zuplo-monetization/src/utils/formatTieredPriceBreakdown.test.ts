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

  it("formats graduated tiers as consecutive unit ranges (First/Next/Over)", () => {
    const lines = formatTieredPriceBreakdown({
      tiers: [
        { upToAmount: "100", unitPriceAmount: "0.01", flatPriceAmount: "3" },
        { upToAmount: "500", unitPriceAmount: "0.008" },
        { unitPriceAmount: "0.005" },
      ],
      mode: "graduated",
      unitLabel: "unit",
      includedLabel: "Included",
      currency: "USD",
    });

    expect(lines).toEqual([
      "First 100: $3 + $0.01/unit",
      "Next 400: $0.008/unit",
      "Over 500: $0.005/unit",
    ]);
  });

  it("formats volume tiers as total-usage brackets with an all-units reminder", () => {
    const lines = formatTieredPriceBreakdown({
      tiers: [
        { upToAmount: "100", unitPriceAmount: "0.01", flatPriceAmount: "3" },
        { upToAmount: "500", unitPriceAmount: "0.008" },
        { unitPriceAmount: "0.005" },
      ],
      mode: "volume",
      unitLabel: "unit",
      includedLabel: "Included",
      currency: "USD",
    });

    expect(lines).toEqual([
      "Up to 100: $3 + $0.01/unit",
      "Up to 500: $0.008/unit (all units)",
      "Over 500: $0.005/unit (all units)",
    ]);
  });

  it("defaults to graduated when mode is omitted", () => {
    const lines = formatTieredPriceBreakdown({
      tiers: [
        { upToAmount: "5000", unitPriceAmount: "0" },
        { unitPriceAmount: "0.05" },
      ],
      unitLabel: "unit",
      includedLabel: "Included",
      currency: "USD",
    });

    expect(lines).toEqual(["First 5,000: Included", "Over 5,000: $0.05/unit"]);
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
      mode: "graduated",
      unitLabel: "unit",
      includedLabel: "Included",
      currency: "USD",
    });

    expect(lines).toEqual([
      "First 1,000,000: $499",
      "Next 1,000,000: $199 + $0.05/unit",
      "Over 2,000,000: $0.02/unit",
    ]);
  });

  it("skips the all-units reminder on volume rows without a per-unit rate", () => {
    // Flat-only and Included rows have no marginal-rate misreading to
    // correct — "(all units)" would be noise on "$499" or "Included".
    const lines = formatTieredPriceBreakdown({
      tiers: [
        { upToAmount: "1000", unitPriceAmount: "0", flatPriceAmount: "0" },
        { upToAmount: "2000", unitPriceAmount: "0", flatPriceAmount: "499" },
        { unitPriceAmount: "0.02" },
      ],
      mode: "volume",
      unitLabel: "unit",
      includedLabel: "Included",
      currency: "USD",
    });

    expect(lines).toEqual([
      "Up to 1,000: Included",
      "Up to 2,000: $499",
      "Over 2,000: $0.02/unit (all units)",
    ]);
  });

  it("renders Included when both flat and unit prices are zero", () => {
    const lines = formatTieredPriceBreakdown({
      tiers: [
        { upToAmount: "1000", unitPriceAmount: "0", flatPriceAmount: "0" },
        { unitPriceAmount: "0.05" },
      ],
      mode: "graduated",
      unitLabel: "unit",
      includedLabel: "Included",
      currency: "USD",
    });

    expect(lines).toEqual(["First 1,000: Included", "Over 1,000: $0.05/unit"]);
  });

  it("falls back to the plain bound when graduated bounds are not increasing", () => {
    // Malformed schedules must never claim a negative "Next" span.
    const lines = formatTieredPriceBreakdown({
      tiers: [
        { upToAmount: "500", unitPriceAmount: "0.01" },
        { upToAmount: "500", unitPriceAmount: "0.005" },
        { unitPriceAmount: "0.001" },
      ],
      mode: "graduated",
      unitLabel: "unit",
      includedLabel: "Included",
      currency: "USD",
    });

    expect(lines).toEqual([
      "First 500: $0.01/unit",
      "Up to 500: $0.005/unit",
      "Over 500: $0.001/unit",
    ]);
  });
});
