import { describe, expect, it } from "vitest";
import type { RateCard } from "../types/PlanType.js";
import { categorizeRateCards } from "./categorizeRateCards.js";

const makeMeteredRateCard = (
  overrides: Partial<{
    isSoftLimit: boolean;
    issueAfterReset: number;
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

  it("uses custom unit label from units config matched by rc.key", () => {
    const { quotas } = categorizeRateCards(
      [
        makeMeteredRateCard({
          tiers: [
            { flatPrice: { amount: "10" }, upToAmount: "1000" },
            { flatPrice: { amount: "0" }, unitPrice: { amount: "0.01" } },
          ],
        }),
      ],
      { units: { requests: "API call" } },
    );
    expect(quotas[0].overagePrice).toMatch(/\/API call$/);
  });

  it("falls back to featureKey lookup when rc.key is not in units", () => {
    const rc: RateCard = {
      type: "usage_based",
      key: "rc-key",
      name: "Requests",
      featureKey: "feature-key",
      billingCadence: "P1M",
      price: {
        type: "tiered",
        mode: "graduated",
        tiers: [
          { flatPrice: { amount: "10" }, upToAmount: "1000" },
          { flatPrice: { amount: "0" }, unitPrice: { amount: "0.01" } },
        ],
      },
      entitlementTemplate: { type: "metered", issueAfterReset: 1000 },
    };
    const { quotas } = categorizeRateCards([rc], {
      units: { "feature-key": "request" },
    });
    expect(quotas[0].overagePrice).toMatch(/\/request$/);
  });

  it("prefers rc.key over featureKey when both are present in units config", () => {
    const rc: RateCard = {
      type: "usage_based",
      key: "rc-key",
      name: "Requests",
      featureKey: "feature-key",
      billingCadence: "P1M",
      price: {
        type: "tiered",
        mode: "graduated",
        tiers: [
          { flatPrice: { amount: "10" }, upToAmount: "1000" },
          { flatPrice: { amount: "0" }, unitPrice: { amount: "0.01" } },
        ],
      },
      entitlementTemplate: { type: "metered", issueAfterReset: 1000 },
    };
    const { quotas } = categorizeRateCards([rc], {
      units: { "rc-key": "token", "feature-key": "request" },
    });
    expect(quotas[0].overagePrice).toMatch(/\/token$/);
  });

  it("falls back to 'unit' when key is not in units config", () => {
    const { quotas } = categorizeRateCards(
      [
        makeMeteredRateCard({
          tiers: [
            { flatPrice: { amount: "10" }, upToAmount: "1000" },
            { flatPrice: { amount: "0" }, unitPrice: { amount: "0.01" } },
          ],
        }),
      ],
      { units: { "other-key": "something" } },
    );
    expect(quotas[0].overagePrice).toMatch(/\/unit$/);
  });

  it("uses rc billingCadence for period", () => {
    const rc: RateCard = {
      type: "usage_based",
      key: "jobs",
      name: "Jobs",
      featureKey: "jobs",
      billingCadence: "P1W",
      price: null,
      entitlementTemplate: {
        type: "metered",
        issueAfterReset: 500,
      },
    };
    const { quotas } = categorizeRateCards([rc]);
    expect(quotas[0].period).toBe("week");
  });

  it("falls back to planBillingCadence when rc billingCadence is missing", () => {
    const rc: RateCard = {
      type: "flat_fee",
      key: "jobs",
      name: "Jobs",
      featureKey: "jobs",
      billingCadence: null,
      price: null,
      entitlementTemplate: {
        type: "metered",
        issueAfterReset: 500,
      },
    };
    const { quotas } = categorizeRateCards([rc], {
      planBillingCadence: "P1Y",
    });
    expect(quotas[0].period).toBe("year");
  });

  it("falls back to 'month' when both billingCadences are missing", () => {
    const rc: RateCard = {
      type: "flat_fee",
      key: "jobs",
      name: "Jobs",
      featureKey: "jobs",
      billingCadence: null,
      price: null,
      entitlementTemplate: {
        type: "metered",
        issueAfterReset: 500,
      },
    };
    const { quotas } = categorizeRateCards([rc]);
    expect(quotas[0].period).toBe("month");
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

  it("omits the redundant included up-to tier in tierPrices when it matches the quota limit", () => {
    const { quotas } = categorizeRateCards([
      makeMeteredRateCard({
        issueAfterReset: 5000,
        tiers: [
          {
            flatPrice: { amount: "0" },
            unitPrice: { amount: "0" },
            upToAmount: "5000",
          },
          { flatPrice: { amount: "0" }, unitPrice: { amount: "0.05" } },
        ],
      }),
    ]);

    expect(quotas[0].tierPrices).toEqual(["Over 5,000: $0.05/unit"]);
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
