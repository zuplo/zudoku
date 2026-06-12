import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Item, Subscription } from "../../types/SubscriptionType.js";
import type { MeteredEntitlement } from "./Usage.js";
import { Usage } from "./Usage.js";

vi.mock("./SwitchPlanModal", () => ({
  SwitchPlanModal: ({ children }: { children: React.ReactNode }) => children,
}));

const makeUsage = (meter: Partial<MeteredEntitlement> = {}) => ({
  $schema: "",
  customerId: "cust-1",
  entitlements: {
    requests: {
      hasAccess: true,
      balance: 500,
      usage: 500,
      overage: 0,
      ...meter,
    },
  },
  planKey: "pro",
  subscriptionId: "sub-1",
  paymentStatus: { status: "paid" as const },
});

const softLimitItem = {
  featureKey: "requests",
  name: "API Requests",
  included: { entitlement: { isSoftLimit: true } },
  price: {
    type: "tiered",
    tiers: [
      { flatPrice: { amount: "10" }, upToAmount: "1000" },
      { flatPrice: { amount: "0" }, unitPrice: { amount: "0.02" } },
    ],
  },
} as Item;

const hardLimitItem = {
  ...softLimitItem,
  included: {
    ...softLimitItem.included,
    entitlement: { isSoftLimit: false },
  },
} as Item;

describe("Usage - UsageItem", () => {
  it("shows overage alert for soft limit with overage", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 1200, overage: 200 })}
        isFetching={false}
        currentItems={[softLimitItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.getByText("You've used your included monthly usage"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("You've reached your monthly limit"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/\+200 overage/)).toBeInTheDocument();
    expect(screen.getByText(/\$0\.02\/call/)).toBeInTheDocument();
  });

  it("shows hard limit alert when at limit", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 1000, overage: 0 })}
        isFetching={false}
        currentItems={[hardLimitItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.getByText("You've reached your monthly limit"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("You've used your included monthly usage"),
    ).not.toBeInTheDocument();
  });

  it("shows no alert for soft limit under quota", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 500, usage: 500, overage: 0 })}
        isFetching={false}
        currentItems={[softLimitItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.queryByText("You've used your included monthly usage"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("You've reached your monthly limit"),
    ).not.toBeInTheDocument();
  });

  it("shows no alert for hard limit under capacity", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 200, usage: 800, overage: 0 })}
        isFetching={false}
        currentItems={[hardLimitItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.queryByText("You've reached your monthly limit"),
    ).not.toBeInTheDocument();
  });

  it("shows hard limit alert and hides overage when hard limit has overage", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 1200, overage: 200 })}
        isFetching={false}
        currentItems={[hardLimitItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.getByText("You've reached your monthly limit"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("You've used your included monthly usage"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/overage/)).not.toBeInTheDocument();
  });

  it("renders without error when limit is zero", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 0, overage: 0 })}
        isFetching={false}
        currentItems={[softLimitItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(screen.getByText(/0 used/)).toBeInTheDocument();
  });

  it("uses billing cadence for period labels", () => {
    const weeklyItem = {
      ...softLimitItem,
      billingCadence: "P1W",
    } as Item;

    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 1200, overage: 200 })}
        isFetching={false}
        currentItems={[weeklyItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.getByText("You've used your included weekly usage"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/remaining this billing period/),
    ).toBeInTheDocument();
  });

  it("uses billingCadence even when usagePeriod is present", () => {
    const itemWithUsagePeriod = {
      ...softLimitItem,
      billingCadence: "P1M",
      included: {
        ...softLimitItem.included,
        entitlement: {
          ...softLimitItem.included.entitlement,
          usagePeriod: { anchor: "", interval: "week", intervalISO: "P1W" },
        },
      },
    } as Item;

    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 1200, overage: 200 })}
        isFetching={false}
        currentItems={[itemWithUsagePeriod]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.getByText("You've used your included monthly usage"),
    ).toBeInTheDocument();
  });

  it("falls back to billing period for multi-unit cadences", () => {
    const quarterlyItem = {
      ...softLimitItem,
      billingCadence: "P3M",
    } as Item;

    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 1200, overage: 200 })}
        isFetching={false}
        currentItems={[quarterlyItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.getByText("You've used your included billing period usage"),
    ).toBeInTheDocument();
  });

  it("falls back to subscription billingCadence when item has no cadence", () => {
    const itemNoCadence = { ...softLimitItem } as Item;
    const subscription = {
      billingCadence: "P1W",
    } as Subscription;

    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 1200, overage: 200 })}
        isFetching={false}
        currentItems={[itemNoCadence]}
        subscription={subscription}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.getByText("You've used your included weekly usage"),
    ).toBeInTheDocument();
  });

  it("defaults to soft limit when item is missing", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 1200, overage: 200 })}
        isFetching={false}
        currentItems={[]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.getByText("You've used your included monthly usage"),
    ).toBeInTheDocument();
  });

  it("shows feature key as title when item is not found", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 500, usage: 500, overage: 0 })}
        isFetching={false}
        currentItems={[]}
        isPendingFirstPayment={false}
      />,
    );
    expect(screen.getByText("requests")).toBeInTheDocument();
  });
});

const payAsYouGoItem = {
  featureKey: "requests",
  name: "API Requests",
  included: { entitlement: { isSoftLimit: true } },
  price: {
    type: "tiered",
    tiers: [{ flatPrice: { amount: "3" }, unitPrice: { amount: "0.01" } }],
  },
} as Item;

describe("Usage - pay-as-you-go and included framing", () => {
  it("shows plain consumption for pay-as-you-go soft limits — no quota math, no alert", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 1200, overage: 1200 })}
        isFetching={false}
        currentItems={[payAsYouGoItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.getByText("1,200 used this billing period"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pay as you go/)).toBeInTheDocument();
    expect(screen.getByText("$0.01/call")).toBeInTheDocument();
    expect(screen.queryByText(/used your included/)).not.toBeInTheDocument();
    expect(screen.queryByText(/limit/)).not.toBeInTheDocument();
    expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();
  });

  it("labels a free-tier-backed soft quota as included, not a limit", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 500, usage: 500, overage: 0 })}
        isFetching={false}
        currentItems={[softLimitItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(screen.getByText(/1,?000 included/)).toBeInTheDocument();
    expect(
      screen.getByText(/500 included remaining this billing period/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/1,?000 limit/)).not.toBeInTheDocument();
  });

  it("shows usage-only framing when a soft limit has no quota issued", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 250, overage: 250 })}
        isFetching={false}
        currentItems={[softLimitItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.getByText("250 used this billing period"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/used your included/)).not.toBeInTheDocument();
    // The price has a free leading tier, so the caption must not claim
    // per-call billing.
    expect(
      screen.getByText(/The first 1,?000 calls are included/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Pay as you go/)).not.toBeInTheDocument();
  });

  it("shows the per-unit rate for unit-priced pay-as-you-go items", () => {
    const unitItem = {
      featureKey: "requests",
      name: "API Requests",
      included: { entitlement: { isSoftLimit: true } },
      price: { type: "unit", amount: "0.05" },
    } as Item;

    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 40, overage: 40 })}
        isFetching={false}
        currentItems={[unitItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(screen.getByText("40 used this billing period")).toBeInTheDocument();
    expect(screen.getByText("$0.05/call")).toBeInTheDocument();
    expect(screen.getByText(/Pay as you go/)).toBeInTheDocument();
  });

  it("doesn't claim pay-as-you-go for price shapes the derivation can't reason about", () => {
    const volumeItem = {
      featureKey: "requests",
      name: "API Requests",
      included: { entitlement: { isSoftLimit: true } },
      price: {
        type: "tiered",
        mode: "volume",
        tiers: [
          { upToAmount: "1000", unitPrice: { amount: "0" } },
          { unitPrice: { amount: "0.02" } },
        ],
      },
    } as Item;

    render(
      <Usage
        usage={makeUsage({ balance: 500, usage: 500, overage: 0 })}
        isFetching={false}
        currentItems={[volumeItem]}
        isPendingFirstPayment={false}
      />,
    );
    // Quota framing stays; no "every call is billed" claim.
    expect(screen.getByText(/1,?000 included/)).toBeInTheDocument();
    expect(screen.queryByText(/Pay as you go/)).not.toBeInTheDocument();
  });
});
