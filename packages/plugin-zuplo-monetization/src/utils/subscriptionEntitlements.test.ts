import { afterEach, describe, expect, it, vi } from "vitest";
import type { Item, Subscription } from "../types/SubscriptionType.js";
import { getPlanPriceSchedule } from "./getPlanPriceSchedule.js";
import {
  categorizeSubscriptionItems,
  getSubscriptionPhaseViews,
  getSubscriptionPlanView,
  hasSubscriptionEntitlements,
  subscriptionToCurrentPlan,
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

const feeItem = (amount: string): Item =>
  item({
    key: "monthly_fee",
    name: "Monthly Fee",
    price: { type: "flat", amount, paymentTerm: "in_advance" },
    billingCadence: "P1M",
  });

const makeSubscriptionPhase = (o: {
  key: string;
  activeFrom: string;
  activeTo?: string;
  items: Item[];
}): Subscription["phases"][number] =>
  ({
    activeFrom: o.activeFrom,
    activeTo: o.activeTo,
    createdAt: o.activeFrom,
    id: `ph-${o.key}`,
    itemTimelines: {},
    items: o.items,
    key: o.key,
    metadata: {},
    name: o.key,
    updatedAt: o.activeFrom,
  }) as unknown as Subscription["phases"][number];

const makeSubscription = (opts: {
  items?: Item[];
  phases?: Subscription["phases"];
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
    phases:
      opts.phases ??
      (opts.items
        ? [
            makeSubscriptionPhase({
              key: "default",
              activeFrom: "2026-01-01T00:00:00.000Z",
              items: opts.items,
            }),
          ]
        : []),
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

  // A two-phase ramp subscription ("$375/month for 3 months, then $750/month"):
  // the price must always come from the phase that is active NOW — the intro
  // price during the intro window, the steady price after it — never from the
  // catalog plan's last phase.
  describe("multi-phase ramp", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    const rampSubscription = () =>
      makeSubscription({
        phases: [
          makeSubscriptionPhase({
            key: "intro",
            activeFrom: "2026-06-04T00:00:00.000Z",
            activeTo: "2026-09-04T00:00:00.000Z",
            items: [
              item({
                key: "monthly_fee",
                name: "Monthly Fee",
                price: {
                  type: "flat",
                  amount: "375",
                  paymentTerm: "in_advance",
                },
                billingCadence: "P1M",
              }),
              item({
                key: "api_requests",
                name: "API Requests",
                entitlement: meteredEntitlement(250_000, "P1M"),
              }),
            ],
          }),
          makeSubscriptionPhase({
            key: "steady",
            activeFrom: "2026-09-04T00:00:00.000Z",
            items: [
              item({
                key: "monthly_fee",
                name: "Monthly Fee",
                price: {
                  type: "flat",
                  amount: "750",
                  paymentTerm: "in_advance",
                },
                billingCadence: "P1M",
              }),
              item({
                key: "api_requests",
                name: "API Requests",
                entitlement: meteredEntitlement(250_000, "P1M"),
              }),
            ],
          }),
        ],
      });

    it("prices the active intro phase, not the future steady phase", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-07-15T00:00:00.000Z"));

      const view = getSubscriptionPlanView(rampSubscription());
      expect(view.usingItems).toBe(true);
      expect(view.priceLabel).toEqual({ type: "priced", amount: 375 });
    });

    it("prices the steady phase once the intro window has passed", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-10-15T00:00:00.000Z"));

      const view = getSubscriptionPlanView(rampSubscription());
      expect(view.usingItems).toBe(true);
      expect(view.priceLabel).toEqual({ type: "priced", amount: 750 });
    });
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

describe("getSubscriptionPhaseViews", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("orders phases by activeFrom and tags them past/current/future with each phase's own price", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-15T00:00:00.000Z"));

    // Deliberately out of chronological order to verify sorting.
    const views = getSubscriptionPhaseViews(
      makeSubscription({
        phases: [
          makeSubscriptionPhase({
            key: "steady",
            activeFrom: "2026-09-04T00:00:00.000Z",
            items: [feeItem("750")],
          }),
          makeSubscriptionPhase({
            key: "trial",
            activeFrom: "2026-05-01T00:00:00.000Z",
            activeTo: "2026-06-04T00:00:00.000Z",
            items: [feeItem("0")],
          }),
          makeSubscriptionPhase({
            key: "intro",
            activeFrom: "2026-06-04T00:00:00.000Z",
            activeTo: "2026-09-04T00:00:00.000Z",
            items: [feeItem("375")],
          }),
        ],
      }),
    );

    expect(views.map((v) => v.name)).toEqual(["trial", "intro", "steady"]);
    expect(views.map((v) => v.status)).toEqual(["past", "current", "future"]);
    expect(views[0].priceLabel).toEqual({ type: "free" });
    expect(views[1].priceLabel).toEqual({ type: "priced", amount: 375 });
    expect(views[2].priceLabel).toEqual({ type: "priced", amount: 750 });
  });

  it("falls back to the catalog plan phase (by key) when a future phase has no items", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-15T00:00:00.000Z"));

    const future = getSubscriptionPhaseViews(
      makeSubscription({
        phases: [
          makeSubscriptionPhase({
            key: "intro",
            activeFrom: "2026-06-04T00:00:00.000Z",
            activeTo: "2026-09-04T00:00:00.000Z",
            items: [feeItem("375")],
          }),
          makeSubscriptionPhase({
            key: "steady",
            activeFrom: "2026-09-04T00:00:00.000Z",
            items: [],
          }),
        ],
        planPhases: [
          {
            key: "steady",
            name: "Steady",
            rateCards: [
              {
                type: "flat_fee",
                key: "base",
                name: "Base",
                billingCadence: "P1M",
                price: { type: "flat", amount: "750" },
              },
            ],
          },
        ],
      }),
    ).find((v) => v.status === "future");

    expect(future?.priceLabel).toEqual({ type: "priced", amount: 750 });
  });
});

describe("subscriptionToCurrentPlan", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps current + future phases (drops past), sourced from provisioned items even when the embedded plan snapshot is empty", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-15T00:00:00.000Z"));

    const plan = subscriptionToCurrentPlan(
      makeSubscription({
        phases: [
          makeSubscriptionPhase({
            key: "trial",
            activeFrom: "2026-05-01T00:00:00.000Z",
            activeTo: "2026-06-04T00:00:00.000Z",
            items: [feeItem("0")],
          }),
          makeSubscriptionPhase({
            key: "intro",
            activeFrom: "2026-06-04T00:00:00.000Z",
            activeTo: "2026-09-04T00:00:00.000Z",
            items: [feeItem("375")],
          }),
          makeSubscriptionPhase({
            key: "steady",
            activeFrom: "2026-09-04T00:00:00.000Z",
            items: [feeItem("750")],
          }),
        ],
        planPhases: [], // embedded snapshot is empty — must not be the source
      }),
    );

    expect(plan.phases.map((p) => p.key)).toEqual(["intro", "steady"]);
    // The synthesized plan feeds the same pricing-table schedule helper, and
    // carries per-phase durations computed from the phase dates so the labels
    // read like the new plan ("First 3 months" / "After that"), not the phase
    // name.
    expect(getPlanPriceSchedule(plan)).toEqual([
      expect.objectContaining({
        label: "First 3 months",
        price: { type: "priced", amount: 375 },
      }),
      expect.objectContaining({
        label: "After that",
        price: { type: "priced", amount: 750 },
      }),
    ]);
  });

  it("prefers the catalog plan phase's authored duration over the date-derived one", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-06-05T00:00:00.000Z"));

    const plan = subscriptionToCurrentPlan(
      makeSubscription({
        phases: [
          makeSubscriptionPhase({
            key: "trial",
            activeFrom: "2026-06-01T00:00:00.000Z",
            activeTo: "2026-06-08T00:00:00.000Z", // 1 week
            items: [feeItem("0")],
          }),
          makeSubscriptionPhase({
            key: "paid",
            activeFrom: "2026-06-08T00:00:00.000Z",
            items: [feeItem("100")],
          }),
        ],
        planPhases: [
          { key: "trial", name: "Trial", duration: "P1W", rateCards: [] },
        ],
      }),
    );

    expect(plan.phases[0].duration).toBe("P1W");
    expect(getPlanPriceSchedule(plan)?.[0].label).toBe("First week");
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
