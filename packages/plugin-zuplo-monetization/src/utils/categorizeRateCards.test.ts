import { describe, expect, it } from "vitest";
import type { RateCard } from "../types/PlanType.js";
import { categorizeRateCards } from "./categorizeRateCards.js";

const makeMeteredRateCard = (
  overrides: Partial<{
    isSoftLimit: boolean;
    issueAfterReset: number;
    mode: "volume" | "graduated";
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
    ? {
        type: "tiered",
        mode: overrides.mode ?? "graduated",
        tiers: overrides.tiers,
      }
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

  // The plan editor always serializes a numeric quota (0 = pay-as-you-go),
  // so a 0 must render exactly like an absent quota — never as "0 / period".
  it("treats a 0 quota on a priced tiered card as pay-as-you-go", () => {
    const { quotas } = categorizeRateCards([
      makeMeteredRateCard({
        isSoftLimit: true,
        issueAfterReset: 0,
        tiers: [
          { unitPrice: { amount: "40" }, upToAmount: "50" },
          { unitPrice: { amount: "10" }, upToAmount: "90" },
          { unitPrice: { amount: "5" } },
        ],
      }),
    ]);
    expect(quotas).toHaveLength(1);
    expect(quotas[0].isPayg).toBe(true);
    expect(quotas[0].tierPrices).toEqual([
      "First 50: $40/unit",
      "Next 40: $10/unit",
      "Over 90: $5/unit",
    ]);
  });

  it("treats a 0 quota on a free-first-tier card as pay-as-you-go with the included range in the breakdown", () => {
    const { quotas } = categorizeRateCards([
      makeMeteredRateCard({
        isSoftLimit: true,
        issueAfterReset: 0,
        tiers: [
          {
            flatPrice: { amount: "0" },
            unitPrice: { amount: "0" },
            upToAmount: "1000",
          },
          { unitPrice: { amount: "0.01" } },
        ],
      }),
    ]);
    expect(quotas).toHaveLength(1);
    expect(quotas[0].isPayg).toBe(true);
    expect(quotas[0].tierPrices).toEqual([
      "First 1,000: Included",
      "Over 1,000: $0.01/unit",
    ]);
  });

  // A positive unit price bills every unit including the issued quota, so
  // the quota is an allowance for the usage meter — not free included usage.
  // The card must show the rate, not "1,000 / month" with the price hidden.
  it("treats a positive quota on a positively unit-priced card as pay-as-you-go", () => {
    const rc: RateCard = {
      type: "usage_based",
      key: "requests",
      name: "Requests",
      featureKey: "requests",
      billingCadence: "P1M",
      price: { type: "unit", amount: "0.03" },
      entitlementTemplate: {
        type: "metered",
        issueAfterReset: 1000,
        isSoftLimit: true,
      },
    };
    const { quotas } = categorizeRateCards([rc]);
    expect(quotas).toHaveLength(1);
    expect(quotas[0]).toMatchObject({
      isPayg: true,
      unitPrice: "$0.03/unit",
    });
  });

  // A hard limit is a real cap the buyer must see: priced cards keep the
  // quota line with the price alongside instead of collapsing to PAYG.
  it("shows both the cap and the rate for a hard limit on a unit-priced card", () => {
    const rc: RateCard = {
      type: "usage_based",
      key: "requests",
      name: "Requests",
      featureKey: "requests",
      billingCadence: "P1M",
      price: { type: "unit", amount: "0.03" },
      entitlementTemplate: {
        type: "metered",
        issueAfterReset: 1000,
        isSoftLimit: false,
      },
    };
    const { quotas } = categorizeRateCards([rc]);
    expect(quotas).toHaveLength(1);
    expect(quotas[0]).toMatchObject({
      limit: 1000,
      period: "month",
      unitPrice: "$0.03/unit",
      isHardCap: true,
    });
    expect(quotas[0].isPayg).toBeUndefined();
  });

  it('renders a hard cap of 0 as a real "0 / period" limit, not pay-as-you-go', () => {
    // A hard limit blocks at the balance, so quota 0 means the feature is
    // fully blocked — "0 / month" is the truthful render, unlike a soft 0
    // which means pay-as-you-go.
    const rc: RateCard = {
      type: "usage_based",
      key: "requests",
      name: "Requests",
      featureKey: "requests",
      billingCadence: "P1M",
      price: { type: "unit", amount: "0.03" },
      entitlementTemplate: {
        type: "metered",
        issueAfterReset: 0,
        isSoftLimit: false,
      },
    };
    const { quotas, features } = categorizeRateCards([rc]);
    expect(features).toHaveLength(0);
    expect(quotas).toHaveLength(1);
    expect(quotas[0]).toMatchObject({
      limit: 0,
      period: "month",
      isHardCap: true,
    });
    expect(quotas[0].isPayg).toBeUndefined();
  });

  it("keeps the cap visible for a hard limit with a free first tier and priced overage", () => {
    // The breakdown's "First X: Included" line conveys the free range but
    // not that the limit is a hard stop — the cap line must stay visible.
    const { quotas } = categorizeRateCards([
      makeMeteredRateCard({
        isSoftLimit: false,
        issueAfterReset: 1000,
        tiers: [
          {
            flatPrice: { amount: "0" },
            unitPrice: { amount: "0" },
            upToAmount: "1000",
          },
          { unitPrice: { amount: "0.05" } },
        ],
      }),
    ]);
    expect(quotas).toHaveLength(1);
    expect(quotas[0]).toMatchObject({ limit: 1000, isHardCap: true });
    expect(quotas[0].isPayg).toBeUndefined();
    expect(quotas[0].tierPrices).toEqual([
      "First 1,000: Included",
      "Over 1,000: $0.05/unit",
    ]);
  });

  it("shows the price inline for a hard limit on a single-tier tiered card", () => {
    // A single tier produces no breakdown (formatTieredPriceBreakdown needs
    // ≥2 tiers), so the price must render inline next to the cap — never a
    // cap with no price at all.
    const { quotas } = categorizeRateCards([
      makeMeteredRateCard({
        isSoftLimit: false,
        issueAfterReset: 500,
        tiers: [{ flatPrice: { amount: "10" }, unitPrice: { amount: "0.05" } }],
      }),
    ]);
    expect(quotas).toHaveLength(1);
    expect(quotas[0]).toMatchObject({
      limit: 500,
      isHardCap: true,
      unitPrice: "$10 + $0.05/unit",
    });
    expect(quotas[0].tierPrices).toBeUndefined();
  });

  it("shows both the cap and the tier breakdown for a hard limit on a priced tiered card", () => {
    const { quotas } = categorizeRateCards([
      makeMeteredRateCard({
        isSoftLimit: false,
        issueAfterReset: 100,
        tiers: [
          { unitPrice: { amount: "40" }, upToAmount: "50" },
          { unitPrice: { amount: "10" } },
        ],
      }),
    ]);
    expect(quotas).toHaveLength(1);
    expect(quotas[0]).toMatchObject({ limit: 100, isHardCap: true });
    expect(quotas[0].tierPrices).toEqual([
      "First 50: $40/unit",
      "Over 50: $10/unit",
    ]);
  });

  it("keeps the quota line for a positive quota on a $0 unit-priced card", () => {
    const rc: RateCard = {
      type: "usage_based",
      key: "requests",
      name: "Requests",
      featureKey: "requests",
      billingCadence: "P1M",
      price: { type: "unit", amount: "0" },
      entitlementTemplate: {
        type: "metered",
        issueAfterReset: 1000,
        isSoftLimit: true,
      },
    };
    const { quotas } = categorizeRateCards([rc]);
    expect(quotas).toHaveLength(1);
    expect(quotas[0]).toMatchObject({ limit: 1000, period: "month" });
    expect(quotas[0].isPayg).toBeUndefined();
  });

  it("treats a 0 quota on a unit-priced card as pay-as-you-go", () => {
    const rc: RateCard = {
      type: "usage_based",
      key: "requests",
      name: "Requests",
      featureKey: "requests",
      billingCadence: "P1M",
      price: { type: "unit", amount: "0.05" },
      entitlementTemplate: {
        type: "metered",
        issueAfterReset: 0,
        isSoftLimit: true,
      },
    };
    const { quotas } = categorizeRateCards([rc]);
    expect(quotas).toHaveLength(1);
    expect(quotas[0]).toMatchObject({
      isPayg: true,
      unitPrice: "$0.05/unit",
    });
  });

  it("renders a 0-quota metered card without a usable price as a plain feature", () => {
    const rc: RateCard = {
      type: "flat_fee",
      key: "jobs",
      name: "Jobs",
      featureKey: "jobs",
      billingCadence: null,
      price: null,
      entitlementTemplate: {
        type: "metered",
        issueAfterReset: 0,
        isSoftLimit: true,
      },
    };
    const { quotas, features } = categorizeRateCards([rc]);
    expect(quotas).toHaveLength(0);
    expect(features).toHaveLength(1);
    expect(features[0]).toMatchObject({ key: "jobs", name: "Jobs" });
  });

  it("emits 'Included' for the free tier and an 'Over X' tier for the overage", () => {
    const { quotas } = categorizeRateCards([
      makeMeteredRateCard({
        isSoftLimit: true,
        tiers: [
          {
            flatPrice: { amount: "0" },
            unitPrice: { amount: "0" },
            upToAmount: "1000",
          },
          { flatPrice: { amount: "0" }, unitPrice: { amount: "0.01" } },
        ],
      }),
    ]);
    expect(quotas[0].tierPrices).toEqual([
      "First 1,000: Included",
      "Over 1,000: $0.01/unit",
    ]);
  });

  it("emits the breakdown when isSoftLimit is undefined", () => {
    const { quotas } = categorizeRateCards([
      makeMeteredRateCard({
        tiers: [
          {
            flatPrice: { amount: "0" },
            unitPrice: { amount: "0" },
            upToAmount: "1000",
          },
          { flatPrice: { amount: "0" }, unitPrice: { amount: "0.05" } },
        ],
      }),
    ]);
    expect(quotas[0].tierPrices).toEqual([
      "First 1,000: Included",
      "Over 1,000: $0.05/unit",
    ]);
  });

  it("uses custom unit label from units config matched by rc.key", () => {
    const { quotas } = categorizeRateCards(
      [
        makeMeteredRateCard({
          tiers: [
            {
              flatPrice: { amount: "0" },
              unitPrice: { amount: "0" },
              upToAmount: "1000",
            },
            { flatPrice: { amount: "0" }, unitPrice: { amount: "0.01" } },
          ],
        }),
      ],
      { units: { requests: "API call" } },
    );
    expect(quotas[0].tierPrices?.[1]).toMatch(/\/API call$/);
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
          {
            flatPrice: { amount: "0" },
            unitPrice: { amount: "0" },
            upToAmount: "1000",
          },
          { flatPrice: { amount: "0" }, unitPrice: { amount: "0.01" } },
        ],
      },
      entitlementTemplate: { type: "metered", issueAfterReset: 1000 },
    };
    const { quotas } = categorizeRateCards([rc], {
      units: { "feature-key": "request" },
    });
    expect(quotas[0].tierPrices?.[1]).toMatch(/\/request$/);
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
          {
            flatPrice: { amount: "0" },
            unitPrice: { amount: "0" },
            upToAmount: "1000",
          },
          { flatPrice: { amount: "0" }, unitPrice: { amount: "0.01" } },
        ],
      },
      entitlementTemplate: { type: "metered", issueAfterReset: 1000 },
    };
    const { quotas } = categorizeRateCards([rc], {
      units: { "rc-key": "token", "feature-key": "request" },
    });
    expect(quotas[0].tierPrices?.[1]).toMatch(/\/token$/);
  });

  it("falls back to 'unit' when key is not in units config", () => {
    const { quotas } = categorizeRateCards(
      [
        makeMeteredRateCard({
          tiers: [
            {
              flatPrice: { amount: "0" },
              unitPrice: { amount: "0" },
              upToAmount: "1000",
            },
            { flatPrice: { amount: "0" }, unitPrice: { amount: "0.01" } },
          ],
        }),
      ],
      { units: { "other-key": "something" } },
    );
    expect(quotas[0].tierPrices?.[1]).toMatch(/\/unit$/);
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

  it("prefers entitlement usagePeriod over rc billingCadence", () => {
    const rc: RateCard = {
      type: "flat_fee",
      key: "api_requests",
      name: "API Requests (Trial)",
      featureKey: "api_requests",
      billingCadence: null,
      price: null,
      entitlementTemplate: {
        type: "metered",
        issueAfterReset: 10000,
        usagePeriod: "P1W",
      },
    };
    const { quotas } = categorizeRateCards([rc], {
      planBillingCadence: "P1M",
    });
    expect(quotas[0].period).toBe("week");
  });

  it("prefers entitlement usagePeriod over planBillingCadence too", () => {
    const rc: RateCard = {
      type: "usage_based",
      key: "api_requests",
      name: "API Requests",
      featureKey: "api_requests",
      billingCadence: "P1M",
      price: null,
      entitlementTemplate: {
        type: "metered",
        issueAfterReset: 1000,
        usagePeriod: "P1D",
      },
    };
    const { quotas } = categorizeRateCards([rc]);
    expect(quotas[0].period).toBe("day");
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

  it("emits the free first tier as a 'First X: Included' line so the included quota is explicit", () => {
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

    expect(quotas[0].tierPrices).toEqual([
      "First 5,000: Included",
      "Over 5,000: $0.05/unit",
    ]);
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

  it.each([
    ["empty string config", JSON.stringify(""), ""],
    ["object value field", JSON.stringify({ value: 5 }), "5"],
    [
      "object config without value",
      JSON.stringify({ mode: "strict", limit: 3 }),
      JSON.stringify({ mode: "strict", limit: 3 }),
    ],
    ["primitive config", JSON.stringify(42), "42"],
    [
      "array config",
      JSON.stringify(["jobs", "exports"]),
      JSON.stringify(["jobs", "exports"]),
    ],
  ])("categorizes static rate card with %s", (_label, config, value) => {
    const { features } = categorizeRateCards([
      {
        type: "flat_fee",
        key: "seats",
        name: "Seats",
        billingCadence: null,
        price: null,
        entitlementTemplate: {
          type: "static",
          config,
        },
      },
    ]);
    expect(features[0]).toMatchObject({
      key: "seats",
      name: "Seats",
      value,
    });
  });

  it("categorizes invalid static config without a value", () => {
    const { features } = categorizeRateCards([
      {
        type: "flat_fee",
        key: "seats",
        name: "Seats",
        billingCadence: null,
        price: null,
        entitlementTemplate: {
          type: "static",
          config: "{invalid-json}",
        },
      },
    ]);

    expect(features[0]).toMatchObject({
      key: "seats",
      name: "Seats",
    });
    expect(features[0].value).toBeUndefined();
  });

  describe("pay-as-you-go (no issueAfterReset)", () => {
    it("adds unit-priced PAYG card as quota with isPayg and unitPrice", () => {
      const rc: RateCard = {
        type: "usage_based",
        key: "api",
        name: "API Calls",
        billingCadence: "P1M",
        price: { type: "unit", amount: "0.10" },
        entitlementTemplate: { type: "metered", isSoftLimit: true },
      };
      const { quotas, features } = categorizeRateCards([rc]);
      expect(features).toEqual([]);
      expect(quotas).toEqual([
        {
          key: "api",
          name: "API Calls",
          limit: 0,
          period: "month",
          isPayg: true,
          unitPrice: "$0.10/unit",
        },
      ]);
    });

    it("uses the configured unit label for PAYG unit pricing", () => {
      const rc: RateCard = {
        type: "usage_based",
        key: "api",
        name: "API Calls",
        billingCadence: "P1M",
        price: { type: "unit", amount: "0.10" },
        entitlementTemplate: { type: "metered", isSoftLimit: true },
      };
      const { quotas } = categorizeRateCards([rc], {
        units: { api: "request" },
      });
      expect(quotas[0].unitPrice).toBe("$0.10/request");
    });

    it("adds tiered PAYG card as quota with tier breakdown", () => {
      const rc: RateCard = {
        type: "usage_based",
        key: "api",
        name: "API Calls",
        billingCadence: "P1M",
        price: {
          type: "tiered",
          mode: "graduated",
          tiers: [
            { upToAmount: "10000", unitPrice: { amount: "0.10" } },
            { unitPrice: { amount: "0.01" } },
          ],
        },
        entitlementTemplate: { type: "metered", isSoftLimit: true },
      };
      const { quotas } = categorizeRateCards([rc]);
      expect(quotas).toHaveLength(1);
      expect(quotas[0]).toMatchObject({
        key: "api",
        name: "API Calls",
        limit: 0,
        period: "month",
        isPayg: true,
      });
      expect(quotas[0].tierPrices).toBeDefined();
      expect(quotas[0].tierPrices?.length).toBeGreaterThan(0);
    });

    it("renders hard-limit unit-priced cards without a quota as a hard cap at 0", () => {
      // An absent quota on a hard limit materializes as a grant of 0, so
      // the entitlement blocks at 0 — the cap line is the truthful render,
      // not a PAYG price implying usable metered access.
      const rc: RateCard = {
        type: "usage_based",
        key: "api",
        name: "API Calls",
        billingCadence: "P1M",
        price: { type: "unit", amount: "0.10" },
        entitlementTemplate: { type: "metered", isSoftLimit: false },
      };
      const { quotas, features } = categorizeRateCards([rc]);
      expect(quotas).toHaveLength(1);
      expect(quotas[0]).toMatchObject({
        key: "api",
        name: "API Calls",
        limit: 0,
        period: "month",
        isHardCap: true,
        unitPrice: "$0.10/unit",
      });
      expect(quotas[0].isPayg).toBeUndefined();
      expect(features).toEqual([]);
    });

    it("treats a single open-ended tiered price as a unit-priced PAYG quota", () => {
      // The metering backend requires at least one tier to be open-ended
      // (no `upToAmount`), so a single-tier tiered price will not carry
      // an upToAmount. Match that shape here.
      const rc: RateCard = {
        type: "usage_based",
        key: "api",
        name: "API Calls",
        billingCadence: "P1M",
        price: {
          type: "tiered",
          mode: "graduated",
          tiers: [{ unitPrice: { amount: "0.05" } }],
        },
        entitlementTemplate: { type: "metered", isSoftLimit: true },
      };
      const { quotas, features } = categorizeRateCards([rc]);
      expect(features).toEqual([]);
      expect(quotas).toEqual([
        {
          key: "api",
          name: "API Calls",
          limit: 0,
          period: "month",
          isPayg: true,
          unitPrice: "$0.05/unit",
        },
      ]);
    });

    it("surfaces both flat and unit price for a single-tier tiered price when both are non-zero", () => {
      // Matches the multi-tier line format: "$flat + $unit/label".
      const rc: RateCard = {
        type: "usage_based",
        key: "api_requests",
        featureKey: "api_requests",
        name: "API Requests Add-On",
        billingCadence: "P1M",
        price: {
          type: "tiered",
          mode: "graduated",
          tiers: [
            {
              flatPrice: { amount: "499" },
              unitPrice: { amount: "0.10" },
            },
          ],
        },
        entitlementTemplate: { type: "metered", isSoftLimit: true },
      };
      const { quotas } = categorizeRateCards([rc], {
        units: { api_requests: "request" },
      });
      expect(quotas[0].unitPrice).toBe("$499 + $0.10/request");
    });

    it("surfaces a single-tier flat-only tiered price as a bare price (no /unit suffix)", () => {
      // Edge case flagged by review: a usage_based card with a single
      // open-ended tier carrying only a flat price (e.g. "$499 flat").
      // Previously dropped to the features bucket, losing the price.
      const rc: RateCard = {
        type: "usage_based",
        key: "api_requests",
        featureKey: "api_requests",
        name: "API Requests Add-On",
        billingCadence: "P1M",
        price: {
          type: "tiered",
          mode: "graduated",
          tiers: [
            {
              flatPrice: { amount: "499" },
              unitPrice: { amount: "0" },
            },
          ],
        },
        entitlementTemplate: { type: "metered", isSoftLimit: true },
      };
      const { quotas, features } = categorizeRateCards([rc]);
      expect(features).toEqual([]);
      expect(quotas).toEqual([
        {
          key: "api_requests",
          name: "API Requests Add-On",
          limit: 0,
          period: "month",
          isPayg: true,
          unitPrice: "$499",
        },
      ]);
    });

    it("falls back to features bucket when all tiers are free", () => {
      const rc: RateCard = {
        type: "usage_based",
        key: "api",
        name: "API Calls",
        billingCadence: "P1M",
        price: {
          type: "tiered",
          mode: "graduated",
          tiers: [
            {
              flatPrice: { amount: "0" },
              unitPrice: { amount: "0" },
              upToAmount: "1000",
            },
            { flatPrice: { amount: "0" }, unitPrice: { amount: "0" } },
          ],
        },
        entitlementTemplate: { type: "metered", isSoftLimit: true },
      };
      const { quotas, features } = categorizeRateCards([rc]);
      expect(quotas).toEqual([]);
      expect(features).toEqual([{ key: "api", name: "API Calls" }]);
    });

    it("falls back to features bucket when unit price is zero", () => {
      const rc: RateCard = {
        type: "usage_based",
        key: "api",
        name: "API Calls",
        billingCadence: "P1M",
        price: { type: "unit", amount: "0" },
        entitlementTemplate: { type: "metered", isSoftLimit: true },
      };
      const { quotas, features } = categorizeRateCards([rc]);
      expect(quotas).toEqual([]);
      expect(features).toEqual([{ key: "api", name: "API Calls" }]);
    });
  });

  describe("tiered plans with a priced first tier", () => {
    it("routes to PAYG when the first tier has a flat price (no free quota)", () => {
      const rc: RateCard = {
        type: "usage_based",
        key: "api_requests",
        name: "API Calls",
        featureKey: "api_requests",
        billingCadence: "P1M",
        price: {
          type: "tiered",
          mode: "graduated",
          tiers: [
            {
              flatPrice: { amount: "499" },
              unitPrice: { amount: "0" },
              upToAmount: "1000000",
            },
            {
              flatPrice: { amount: "199" },
              unitPrice: { amount: "0.05" },
              upToAmount: "2000000",
            },
            { flatPrice: { amount: "0" }, unitPrice: { amount: "0.02" } },
          ],
        },
        entitlementTemplate: {
          type: "metered",
          isSoftLimit: true,
          issueAfterReset: 1000000,
        },
      };
      const { quotas } = categorizeRateCards([rc]);
      expect(quotas).toHaveLength(1);
      expect(quotas[0]).toMatchObject({
        key: "api_requests",
        name: "API Calls",
        limit: 0,
        isPayg: true,
      });
      expect(quotas[0].tierPrices).toEqual([
        "First 1,000,000: $499",
        "Next 1,000,000: $199 + $0.05/unit",
        "Over 2,000,000: $0.02/unit",
      ]);
    });

    it("routes to PAYG when the first tier has a unit price (no free quota)", () => {
      const rc: RateCard = {
        type: "usage_based",
        key: "api",
        name: "API Calls",
        billingCadence: "P1M",
        price: {
          type: "tiered",
          mode: "graduated",
          tiers: [
            { unitPrice: { amount: "0.10" }, upToAmount: "10000" },
            { unitPrice: { amount: "0.05" } },
          ],
        },
        entitlementTemplate: {
          type: "metered",
          isSoftLimit: true,
          issueAfterReset: 10000,
        },
      };
      const { quotas } = categorizeRateCards([rc]);
      expect(quotas[0]).toMatchObject({ isPayg: true, limit: 0 });
    });

    it("keeps the cap visible for a priced-first-tier card with isSoftLimit=false", () => {
      // A hard limit is a real cap the buyer must see: unlike a soft limit,
      // the card keeps the quota line (marked isHardCap so the UI renders it
      // alongside the tier breakdown) instead of collapsing to PAYG.
      const rc: RateCard = {
        type: "usage_based",
        key: "api",
        name: "API Calls",
        billingCadence: "P1M",
        price: {
          type: "tiered",
          mode: "graduated",
          tiers: [
            { flatPrice: { amount: "10" }, upToAmount: "1000" },
            { unitPrice: { amount: "0.05" } },
          ],
        },
        entitlementTemplate: {
          type: "metered",
          isSoftLimit: false,
          issueAfterReset: 1000,
        },
      };
      const { quotas } = categorizeRateCards([rc]);
      expect(quotas).toHaveLength(1);
      expect(quotas[0]).toMatchObject({ limit: 1000, isHardCap: true });
      expect(quotas[0].isPayg).toBeUndefined();
      expect(quotas[0].tierPrices).toEqual([
        "First 1,000: $10",
        "Over 1,000: $0.05/unit",
      ]);
    });

    it("keeps free-first-tier (flat=0, unit=0) cards as quotas with limit", () => {
      const rc: RateCard = {
        type: "usage_based",
        key: "api",
        name: "API Calls",
        billingCadence: "P1M",
        price: {
          type: "tiered",
          mode: "graduated",
          tiers: [
            {
              flatPrice: { amount: "0" },
              unitPrice: { amount: "0" },
              upToAmount: "5000",
            },
            { unitPrice: { amount: "0.05" } },
          ],
        },
        entitlementTemplate: {
          type: "metered",
          isSoftLimit: true,
          issueAfterReset: 5000,
        },
      };
      const { quotas } = categorizeRateCards([rc]);
      expect(quotas[0]).toMatchObject({ limit: 5000 });
      expect(quotas[0].tierPrices).toEqual([
        "First 5,000: Included",
        "Over 5,000: $0.05/unit",
      ]);
      expect(quotas[0].isPayg).toBeUndefined();
    });
  });

  describe("volume vs graduated price modes", () => {
    const tiers = [
      {
        flatPrice: { amount: "3" },
        unitPrice: { amount: "0.01" },
        upToAmount: "100",
      },
      { unitPrice: { amount: "0.005" } },
    ];

    it("renders volume tiers as total-usage brackets with an all-units reminder", () => {
      const { quotas } = categorizeRateCards([
        makeMeteredRateCard({
          isSoftLimit: true,
          issueAfterReset: 0,
          mode: "volume",
          tiers,
        }),
      ]);
      expect(quotas[0].tierPrices).toEqual([
        "Up to 100: $3 + $0.01/unit",
        "Over 100: $0.005/unit (all units)",
      ]);
    });

    it("uses the configured unit label in the all-units reminder", () => {
      const { quotas } = categorizeRateCards(
        [
          makeMeteredRateCard({
            isSoftLimit: true,
            issueAfterReset: 0,
            mode: "volume",
            tiers,
          }),
        ],
        { units: { requests: "request" } },
      );
      expect(quotas[0].tierPrices).toEqual([
        "Up to 100: $3 + $0.01/request",
        "Over 100: $0.005/request (all requests)",
      ]);
    });

    it("renders the same tiers as consecutive ranges under graduated mode", () => {
      const { quotas } = categorizeRateCards([
        makeMeteredRateCard({
          isSoftLimit: true,
          issueAfterReset: 0,
          mode: "graduated",
          tiers,
        }),
      ]);
      expect(quotas[0].tierPrices).toEqual([
        "First 100: $3 + $0.01/unit",
        "Over 100: $0.005/unit",
      ]);
    });

    it("keeps volume wording on the included-quota branch too", () => {
      // Free first tier + soft quota routes through the quota branch (not
      // PAYG); the volume bracket wording must carry over there as well.
      const { quotas } = categorizeRateCards([
        makeMeteredRateCard({
          isSoftLimit: true,
          issueAfterReset: 1000,
          mode: "volume",
          tiers: [
            {
              flatPrice: { amount: "0" },
              unitPrice: { amount: "0" },
              upToAmount: "1000",
            },
            { unitPrice: { amount: "0.05" } },
          ],
        }),
      ]);
      expect(quotas[0]).toMatchObject({ limit: 1000 });
      expect(quotas[0].tierPrices).toEqual([
        "Up to 1,000: Included",
        "Over 1,000: $0.05/unit (all units)",
      ]);
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
