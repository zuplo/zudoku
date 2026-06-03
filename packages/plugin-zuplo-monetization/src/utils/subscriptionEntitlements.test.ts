import { describe, expect, it } from "vitest";
import type { Item } from "../types/SubscriptionType.js";
import { categorizeSubscriptionItems } from "./subscriptionEntitlements.js";

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

const meteredEntitlement = (issueAfterReset?: number): Entitlement => ({
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
  usagePeriod: { anchor: "x", interval: "PT1H", intervalISO: "PT1H" },
});

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

  it("returns empty sets for no items", () => {
    expect(categorizeSubscriptionItems([])).toEqual({
      quotas: [],
      features: [],
    });
  });
});
