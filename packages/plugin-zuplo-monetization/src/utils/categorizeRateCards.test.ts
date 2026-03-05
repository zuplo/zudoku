import { describe, expect, it } from "vitest";
import type { RateCard } from "../types/PlanType.js";
import { categorizeRateCards } from "./categorizeRateCards.js";

const makeMeteredRateCard = (
  overrides: Partial<{
    isSoftLimit: boolean;
    issueAfterReset: number;
    usagePeriod: string;
    tiers: Array<{
      flatPrice?: { amount: string };
      unitPrice?: { amount: string };
      upToAmount?: string;
    }>;
  }> = {},
): RateCard => ({
  type: "usage_based",
  key: "requests",
  name: "Requests",
  featureKey: "requests",
  billingCadence: "P1M",
  price: overrides.tiers
    ? { type: "tiered", mode: "graduated", tiers: overrides.tiers }
    : null,
  entitlementTemplate: {
    type: "metered",
    issueAfterReset: overrides.issueAfterReset ?? 1000,
    isSoftLimit: overrides.isSoftLimit,
    usagePeriod: overrides.usagePeriod ?? "P1M",
  },
});

describe("categorizeRateCards", () => {
  it("categorizes metered rate card as quota", () => {
    const { quotas } = categorizeRateCards([makeMeteredRateCard()]);
    expect(quotas).toHaveLength(1);
    expect(quotas[0]).toMatchObject({
      key: "requests",
      name: "Requests",
      limit: 1000,
    });
  });

  it("includes overage price when isSoftLimit is true", () => {
    const { quotas } = categorizeRateCards([
      makeMeteredRateCard({
        isSoftLimit: true,
        tiers: [
          { flatPrice: { amount: "10" }, upToAmount: "1000" },
          { flatPrice: { amount: "0" }, unitPrice: { amount: "0.01" } },
        ],
      }),
    ]);
    expect(quotas[0].overagePrice).toBe("$0.01/unit");
  });

  it("includes overage price when isSoftLimit is undefined", () => {
    const { quotas } = categorizeRateCards([
      makeMeteredRateCard({
        tiers: [
          { flatPrice: { amount: "10" }, upToAmount: "1000" },
          { flatPrice: { amount: "0" }, unitPrice: { amount: "0.05" } },
        ],
      }),
    ]);
    expect(quotas[0].overagePrice).toBe("$0.05/unit");
  });

  it("excludes overage price when isSoftLimit is false", () => {
    const { quotas } = categorizeRateCards([
      makeMeteredRateCard({
        isSoftLimit: false,
        tiers: [
          { flatPrice: { amount: "10" }, upToAmount: "1000" },
          { flatPrice: { amount: "0" }, unitPrice: { amount: "0.01" } },
        ],
      }),
    ]);
    expect(quotas[0].overagePrice).toBeUndefined();
  });

  it("categorizes boolean rate card as feature", () => {
    const { features } = categorizeRateCards([
      {
        type: "flat_fee",
        key: "support",
        name: "Priority Support",
        billingCadence: null,
        price: null,
        entitlementTemplate: { type: "boolean" },
      },
    ]);
    expect(features).toHaveLength(1);
    expect(features[0]).toMatchObject({
      key: "support",
      name: "Priority Support",
    });
  });

  it("categorizes static rate card as feature with value", () => {
    const { features } = categorizeRateCards([
      {
        type: "flat_fee",
        key: "seats",
        name: "Seats",
        billingCadence: null,
        price: null,
        entitlementTemplate: {
          type: "static",
          config: JSON.stringify({ value: 5 }),
        },
      },
    ]);
    expect(features[0]).toMatchObject({
      key: "seats",
      name: "Seats",
      value: "5",
    });
  });

  it("skips rate cards without entitlement template", () => {
    const { quotas, features } = categorizeRateCards([
      {
        type: "flat_fee",
        key: "base",
        name: "Base Fee",
        billingCadence: "P1M",
        price: { type: "flat", amount: "10" },
      },
    ]);
    expect(quotas).toHaveLength(0);
    expect(features).toHaveLength(0);
  });
});
