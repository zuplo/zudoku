import { describe, expect, it } from "vitest";
import type { Item, Subscription } from "../types/SubscriptionType.js";
import {
  categorizeSubscriptionItems,
  getSubscriptionPlanView,
  hasSubscriptionEntitlements,
} from "./subscriptionEntitlements.js";

type Entitlement = NonNullable<Item["included"]["entitlement"]>;

const item = (o: {
  key: string;
  name?: string;
  entitlement?: Entitlement;
  price?: Item["price"];
  billingCadence?: string;
}): Item => ({
  activeFrom: "2026-05-27T12:55:22.000Z",
  billingCadence: o.billingCadence,
  createdAt: "2026-05-27T12:55:22.000Z",
  featureKey: o.key,
  id: `item-${o.key}`,
  included: {
    entitlement: o.entitlement,
    feature: {
      createdAt: "2026-05-08T16:06:42.000Z",
      id: `feat-${o.key}`,
      key: o.key,
      name: o.name ?? o.key,
      updatedAt: "2026-05-08T16:06:42.000Z",
    },
  },
  key: o.key,
  metadata: {},
  name: o.name ?? o.key,
  price: o.price,
  updatedAt: "2026-05-27T12:55:22.000Z",
});

const meteredEntitlement = (
  issueAfterReset?: number,
  intervalISO = "PT1H",
): Entitlement => ({
  activeFrom: "2026-05-27T12:55:22.000Z",
  annotations: { "subscription.id": "sub-1" },
  createdAt: "2026-05-27T12:55:22.000Z",
  featureId: "feat",
  featureKey: "api_requests",
  id: "ent-1",
  subjectKey: "sub",
  type: "metered",
  updatedAt: "2026-05-27T12:55:22.000Z",
  ...(issueAfterReset != null ? { issueAfterReset } : {}),
  usagePeriod: { anchor: "x", interval: intervalISO, intervalISO },
});

const makeSubscription = (opts: {
  items?: Item[];
  planPhases?: Subscription["plan"]["phases"];
}): Subscription =>
  ({
    id: "sub-1",
    currency: "USD",
    billingCadence: "P1M",
    activeFrom: "2026-01-01T00:00:00.000Z",
    plan: {
      id: "plan-1",
      key: "plan",
      name: "Plan",
      billingCadence: "P1M",
      currency: "USD",
      phases: opts.planPhases ?? [],
    },
    phases: opts.items
      ? [
          {
            activeFrom: "2026-01-01T00:00:00.000Z",
            createdAt: "2026-01-01T00:00:00.000Z",
            id: "ph",
            itemTimelines: {},
            items: opts.items,
            key: "default",
            metadata: {},
            name: "Default",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ]
      : [],
  }) as unknown as Subscription;

describe("categorizeSubscriptionItems", () => {
  it("reports the REAL included quota from a free metered item (not 0)", () => {
    const { quotas } = categorizeSubscriptionItems(
      [
        item({
          key: "api_requests",
          name: "API Requests",
          entitlement: meteredEntitlement(10),
        }),
      ],
      { units: { api_requests: "request" } },
    );
    expect(quotas).toHaveLength(1);
    expect(quotas[0]).toMatchObject({ limit: 10, period: "hour" });
    expect(quotas[0].isPayg).toBeFalsy();
  });

  it("shows the per-unit price for a priced single-tier metered item (test_single_tier_tiered)", () => {
    const { quotas } = categorizeSubscriptionItems(
      [
        item({
          key: "api_requests",
          name: "API Requests",
          entitlement: meteredEntitlement(10),
          price: {
            type: "tiered",
            mode: "graduated",
            tiers: [
              {
                flatPrice: { amount: "3", type: "flat" },
                unitPrice: { amount: "0.01", type: "unit" },
              },
            ],
          },
        }),
      ],
      { units: { api_requests: "request" } },
    );
    expect(quotas).toHaveLength(1);
    expect(quotas[0].isPayg).toBe(true);
    expect(quotas[0].unitPrice).toBe("$3 + $0.01/request");
  });

  it("omits pure recurring fees (items without an entitlement)", () => {
    const result = categorizeSubscriptionItems([
      item({
        key: "monthly_fee",
        name: "Monthly Fee",
        price: { type: "flat", amount: "99", paymentTerm: "in_advance" },
      }),
    ]);
    expect(result.quotas).toHaveLength(0);
    expect(result.features).toHaveLength(0);
  });

  it("maps boolean entitlements to features", () => {
    const { features } = categorizeSubscriptionItems([
      item({
        key: "priority_support",
        name: "Priority Support",
        entitlement: {
          activeFrom: "x",
          annotations: { "subscription.id": "sub-1" },
          createdAt: "x",
          featureId: "f",
          featureKey: "priority_support",
          id: "e",
          subjectKey: "s",
          type: "boolean",
          updatedAt: "x",
        },
      }),
    ]);
    expect(features).toEqual([
      { key: "priority_support", name: "Priority Support" },
    ]);
  });

  it("maps static entitlements to features carrying the config value", () => {
    const { features } = categorizeSubscriptionItems([
      item({
        key: "api_version",
        name: "Static feature",
        entitlement: {
          activeFrom: "x",
          annotations: { "subscription.id": "sub-1" },
          createdAt: "x",
          featureId: "f",
          featureKey: "api_version",
          id: "e",
          subjectKey: "s",
          type: "static",
          config: JSON.stringify({ value: "v2" }),
          updatedAt: "x",
        },
      }),
    ]);
    expect(features).toEqual([
      { key: "api_version", name: "Static feature", value: "v2" },
    ]);
  });

  it("maps an invalid static config to a feature without a value (no 'undefined' leak)", () => {
    const { features } = categorizeSubscriptionItems([
      item({
        key: "api_version",
        name: "Static feature",
        entitlement: {
          activeFrom: "x",
          annotations: { "subscription.id": "sub-1" },
          createdAt: "x",
          featureId: "f",
          featureKey: "api_version",
          id: "e",
          subjectKey: "s",
          type: "static",
          config: "{invalid-json",
          updatedAt: "x",
        },
      }),
    ]);
    expect(features).toHaveLength(1);
    expect(features[0]).toMatchObject({
      key: "api_version",
      name: "Static feature",
    });
    expect(features[0].value).toBeUndefined();
  });

  it("returns empty sets for no items", () => {
    expect(categorizeSubscriptionItems([])).toEqual({
      quotas: [],
      features: [],
    });
  });
});

describe("getSubscriptionPlanView", () => {
  it("derives price + entitlements from the active phase's items", () => {
    const view = getSubscriptionPlanView(
      makeSubscription({
        items: [
          item({
            key: "monthly_fee",
            name: "Monthly Fee",
            price: { type: "flat", amount: "99", paymentTerm: "in_advance" },
            billingCadence: "P1M",
          }),
          item({
            key: "api_requests",
            name: "API Calls",
            entitlement: meteredEntitlement(1000, "P1M"),
          }),
        ],
      }),
      { units: { api_requests: "request" } },
    );

    expect(view.usingItems).toBe(true);
    expect(view.priceLabel).toEqual({ type: "priced", amount: 99 });
    expect(view.entitlements.quotas).toEqual([
      expect.objectContaining({
        key: "api_requests",
        limit: 1000,
        period: "month",
      }),
    ]);
  });

  // Regression: "Fixed Quota Hourly" — a metered item priced with a flat
  // recurring fee ($2.99/hour bundling 10 requests/hour). The flat fee is the
  // headline price, NOT "Pay as you go"; the catalog authors this as a
  // `flat_fee` rate card carrying a metered entitlement template, and the
  // subscription view must agree (it previously rendered "Pay as you go"
  // because every metered item was forced to `usage_based`).
  it("treats a flat recurring price on a metered item as the headline price, not PAYG", () => {
    const view = getSubscriptionPlanView(
      makeSubscription({
        items: [
          item({
            key: "api_requests",
            name: "API Requests",
            entitlement: meteredEntitlement(10, "PT1H"),
            price: { type: "flat", amount: "2.99", paymentTerm: "in_advance" },
            billingCadence: "PT1H",
          }),
        ],
      }),
      { units: { api_requests: "request" } },
    );

    expect(view.priceLabel).toEqual({ type: "priced", amount: 2.99 });
    expect(view.entitlements.quotas).toEqual([
      expect.objectContaining({ limit: 10, period: "hour" }),
    ]);
    expect(view.entitlements.quotas[0].isPayg).toBeFalsy();
  });

  it("falls back to the catalog plan when there are no provisioned items", () => {
    const view = getSubscriptionPlanView(
      makeSubscription({
        planPhases: [
          {
            key: "default",
            name: "Default",
            rateCards: [
              {
                type: "flat_fee",
                key: "base",
                name: "Base",
                billingCadence: "P1M",
                price: { type: "flat", amount: "49" },
              },
            ],
          },
        ],
      }),
    );

    expect(view.usingItems).toBe(false);
    expect(view.priceLabel).toEqual({ type: "priced", amount: 49 });
    expect(view.fallbackPhases).toHaveLength(1);
  });

  // Regression for the reviewer's concern: a paid active phase must not read as
  // "Free" just because the embedded plan snapshot has no phases.
  it("does not show Free for a paid active phase when plan.phases is empty", () => {
    const view = getSubscriptionPlanView(
      makeSubscription({
        items: [
          item({
            key: "monthly_fee",
            name: "Monthly Fee",
            price: { type: "flat", amount: "99", paymentTerm: "in_advance" },
            billingCadence: "P1M",
          }),
        ],
        planPhases: [],
      }),
    );

    expect(view.priceLabel).toEqual({ type: "priced", amount: 99 });
  });
});

describe("hasSubscriptionEntitlements", () => {
  it("is true when the active items carry entitlements", () => {
    const view = getSubscriptionPlanView(
      makeSubscription({
        items: [
          item({
            key: "api_requests",
            name: "API",
            entitlement: meteredEntitlement(10),
          }),
        ],
      }),
    );
    expect(hasSubscriptionEntitlements(view)).toBe(true);
  });

  it("is false when nothing is included", () => {
    expect(
      hasSubscriptionEntitlements(
        getSubscriptionPlanView(makeSubscription({ planPhases: [] })),
      ),
    ).toBe(false);
  });
});
