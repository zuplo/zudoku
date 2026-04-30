import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Subscription } from "../../types/SubscriptionType.js";
import { SubscriptionPlanDetails } from "./SubscriptionPlanDetails.js";

vi.mock("../../MonetizationContext.js", () => ({
  useMonetizationConfig: () => ({
    pricing: { units: { api: "call" } },
  }),
}));

const makeSubscription = (
  overrides: Partial<Subscription> = {},
): Subscription => ({
  activeFrom: "2026-04-01T12:00:00.000Z",
  alignment: {
    billablesMustAlign: true,
    currentAlignedBillingPeriod: {
      from: "2026-04-01T12:00:00.000Z",
      to: "2026-05-01T12:00:00.000Z",
    },
  },
  billingAnchor: "2026-04-01T12:00:00.000Z",
  billingCadence: "P1M",
  createdAt: "2026-04-01T12:00:00.000Z",
  currency: "USD",
  customerId: "cust-1",
  id: "sub-1",
  metadata: {},
  name: "My subscription",
  phases: [
    {
      activeFrom: "2026-04-01T12:00:00.000Z",
      createdAt: "2026-04-01T12:00:00.000Z",
      id: "phase-1",
      itemTimelines: {},
      items: [
        {
          activeFrom: "2026-04-01T12:00:00.000Z",
          billingCadence: "P1M",
          createdAt: "2026-04-01T12:00:00.000Z",
          featureKey: "api",
          id: "item-1",
          included: {
            entitlement: {
              activeFrom: "2026-04-01T12:00:00.000Z",
              annotations: { "subscription.id": "sub-1" },
              createdAt: "2026-04-01T12:00:00.000Z",
              featureId: "feat-1",
              featureKey: "api",
              id: "ent-1",
              isSoftLimit: true,
              isUnlimited: false,
              issueAfterReset: 1000,
              subjectKey: "sub",
              type: "metered",
              updatedAt: "2026-04-01T12:00:00.000Z",
            },
            feature: {
              createdAt: "2026-04-01T12:00:00.000Z",
              id: "feat-1",
              key: "api",
              name: "API",
              updatedAt: "2026-04-01T12:00:00.000Z",
            },
          },
          key: "api",
          metadata: {},
          name: "API",
          price: {
            type: "tiered",
            tiers: [
              {
                flatPrice: { amount: "0", type: "money" },
                unitPrice: { amount: "0.1", type: "money" },
              },
            ],
          },
          updatedAt: "2026-04-01T12:00:00.000Z",
        },
      ],
      key: "trial",
      metadata: {},
      name: "Trial",
      updatedAt: "2026-04-01T12:00:00.000Z",
    },
    {
      activeFrom: "2026-05-01T12:00:00.000Z",
      createdAt: "2026-04-01T12:00:00.000Z",
      id: "phase-2",
      itemTimelines: {},
      items: [
        {
          activeFrom: "2026-05-01T12:00:00.000Z",
          billingCadence: "P1M",
          createdAt: "2026-04-01T12:00:00.000Z",
          featureKey: "feature_bool",
          id: "item-2",
          included: {
            entitlement: {
              activeFrom: "2026-05-01T12:00:00.000Z",
              annotations: { "subscription.id": "sub-1" },
              createdAt: "2026-04-01T12:00:00.000Z",
              featureId: "feat-2",
              featureKey: "feature_bool",
              id: "ent-2",
              subjectKey: "sub",
              type: "boolean",
              updatedAt: "2026-04-01T12:00:00.000Z",
            },
            feature: {
              createdAt: "2026-04-01T12:00:00.000Z",
              id: "feat-2",
              key: "feature_bool",
              name: "Boolean feature",
              updatedAt: "2026-04-01T12:00:00.000Z",
            },
          },
          key: "feature_bool",
          metadata: {},
          name: "Boolean feature",
          updatedAt: "2026-04-01T12:00:00.000Z",
        },
        {
          activeFrom: "2026-05-01T12:00:00.000Z",
          billingCadence: "P1M",
          createdAt: "2026-04-01T12:00:00.000Z",
          featureKey: "feature_static",
          id: "item-3",
          included: {
            entitlement: {
              activeFrom: "2026-05-01T12:00:00.000Z",
              annotations: { "subscription.id": "sub-1" },
              config: '{"value":"v2"}',
              createdAt: "2026-04-01T12:00:00.000Z",
              featureId: "feat-3",
              featureKey: "feature_static",
              id: "ent-3",
              subjectKey: "sub",
              type: "static",
              updatedAt: "2026-04-01T12:00:00.000Z",
            },
            feature: {
              createdAt: "2026-04-01T12:00:00.000Z",
              id: "feat-3",
              key: "feature_static",
              name: "Static feature",
              updatedAt: "2026-04-01T12:00:00.000Z",
            },
          },
          key: "feature_static",
          metadata: {},
          name: "Static feature",
          updatedAt: "2026-04-01T12:00:00.000Z",
        },
      ],
      key: "paid",
      metadata: {},
      name: "Paid",
      updatedAt: "2026-04-01T12:00:00.000Z",
    },
  ],
  plan: {
    id: "plan-1",
    key: "plan",
    name: "Plan name",
    billingCadence: "P1M",
    phases: [],
    monthlyPrice: null,
    yearlyPrice: null,
    version: 1,
  },
  proRatingConfig: { enabled: true, mode: "prorate_prices" },
  status: "active",
  updatedAt: "2026-04-01T12:00:00.000Z",
  consumer: {
    id: "consumer-1",
    name: "Consumer",
    createdOn: "2026-04-01T12:00:00.000Z",
    updatedOn: "2026-04-01T12:00:00.000Z",
    tags: {},
    metadata: {},
    apiKeys: [],
    managers: [],
  },
  ...overrides,
});

describe("SubscriptionPlanDetails", () => {
  it("renders metered + boolean + static features with correct values and overage", () => {
    render(<SubscriptionPlanDetails subscription={makeSubscription()} />);

    expect(screen.getByText("Plan name")).toBeInTheDocument();
    expect(screen.getByText("Subscription ID")).toBeInTheDocument();
    expect(screen.getByText("sub-1")).toBeInTheDocument();
    expect(screen.getByText("Active since")).toBeInTheDocument();
    expect(screen.getByText("Current period")).toBeInTheDocument();
    expect(
      screen.getByText(/Apr\s+1,\s+2026\s+–\s+May\s+1,\s+2026/),
    ).toBeInTheDocument();

    // Metered row
    const api = screen.getByText("API").closest("li");
    expect(api).not.toBeNull();
    if (!api) throw new Error("Expected API row");
    expect(within(api).getByText("1,000 / month")).toBeInTheDocument();
    expect(within(api).getByText("Overage: $0.10/call")).toBeInTheDocument();

    // Boolean row
    const boolRow = screen.getByText("Boolean feature").closest("li");
    expect(boolRow).not.toBeNull();
    if (!boolRow) throw new Error("Expected boolean row");
    expect(within(boolRow).getByText("Included")).toBeInTheDocument();

    // Static row shows value
    expect(screen.getByText(/Static feature/i)).toBeInTheDocument();
    expect(screen.getAllByText("v2").length).toBeGreaterThan(0);
  });

  it('renders "Starts <date>" when activeTo is missing', () => {
    render(<SubscriptionPlanDetails subscription={makeSubscription()} />);

    // Date ranges are displayed per row.
    const api = screen.getByText("API").closest("li");
    if (!api) throw new Error("Expected API row");
    expect(
      within(api).getByText(/Starts\s+Apr\s+1,\s+2026/),
    ).toBeInTheDocument();

    // Paid phase starts later -> should show Starts <date>.
    const boolRow = screen.getByText("Boolean feature").closest("li");
    if (!boolRow) throw new Error("Expected boolean row");
    expect(
      within(boolRow).getByText(/Starts\s+May\s+1,\s+2026/),
    ).toBeInTheDocument();
  });

  it("does not show overage price for hard-limit meters", () => {
    const base = makeSubscription();
    const baseEntitlement = base.phases[0]?.items[0]?.included?.entitlement;
    if (!baseEntitlement) {
      throw new Error("Expected base metered entitlement");
    }

    const subscription = makeSubscription({
      phases: [
        {
          ...base.phases[0],
          items: [
            {
              ...base.phases[0].items[0],
              included: {
                ...base.phases[0].items[0].included,
                entitlement: {
                  ...baseEntitlement,
                  isSoftLimit: false,
                },
              },
            },
          ],
        },
      ],
    });

    render(<SubscriptionPlanDetails subscription={subscription} />);
    const api = screen.getByText("API").closest("li");
    if (!api) throw new Error("Expected API row");
    expect(within(api).queryByText(/Overage:/)).not.toBeInTheDocument();
  });

  it("shows a subscription tax legend under Price when plan.defaultTaxConfig.behavior is set", () => {
    const subscription = makeSubscription({
      plan: {
        ...makeSubscription().plan,
        defaultTaxConfig: { behavior: "exclusive" },
      },
    });

    render(<SubscriptionPlanDetails subscription={subscription} />);

    expect(
      screen.getByText(
        "Price excludes tax; taxes may be added on invoice if applicable.",
      ),
    ).toBeInTheDocument();
  });

  it("does not render a tax legend for unsupported behavior values", () => {
    const subscription = makeSubscription({
      plan: {
        ...makeSubscription().plan,
        defaultTaxConfig: { behavior: "NONE" },
      },
    });

    render(<SubscriptionPlanDetails subscription={subscription} />);

    expect(screen.queryByText(/Price excludes tax;/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Price includes tax/i)).not.toBeInTheDocument();
  });

  it("does not render a tax legend when behavior is missing", () => {
    render(<SubscriptionPlanDetails subscription={makeSubscription()} />);
    expect(
      screen.queryByText(/Taxes may be added to your invoice/i),
    ).not.toBeInTheDocument();
  });
});
