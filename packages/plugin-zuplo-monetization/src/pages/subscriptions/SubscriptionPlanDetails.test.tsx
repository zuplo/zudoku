import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Plan, PlanPhase, RateCard } from "../../types/PlanType.js";
import type {
  Subscription,
  SubscriptionPlan,
} from "../../types/SubscriptionType.js";
import { SubscriptionPlanDetails } from "./SubscriptionPlanDetails.js";

vi.mock("../../MonetizationContext.js", () => ({
  useMonetizationConfig: () => ({
    pricing: { units: { api_requests: "request" } },
  }),
}));

const phase = (
  rateCards: RateCard[],
  overrides: Partial<PlanPhase> = {},
): PlanPhase => ({
  key: "default",
  name: "Default",
  rateCards,
  ...overrides,
});

const makePlan = (overrides: Partial<Plan> = {}): SubscriptionPlan => ({
  id: "plan-1",
  key: "plan",
  name: "Plan name",
  billingCadence: "P1M",
  version: 1,
  currency: "USD",
  phases: [],
  ...overrides,
});

const flatFeeCard = (amount: string): RateCard => ({
  type: "flat_fee",
  key: "base",
  name: "Base",
  billingCadence: "P1M",
  price: { type: "flat", amount },
});

// Single-tier "tiered" price ($3 flat + $0.01/unit) on a metered usage card —
// the `test_single_tier_tiered` shape from the report.
const singleTierUsageCard = (): RateCard => ({
  type: "usage_based",
  key: "api_requests",
  name: "API Requests",
  featureKey: "api_requests",
  billingCadence: "PT1H",
  price: {
    type: "tiered",
    mode: "graduated",
    tiers: [{ flatPrice: { amount: "3" }, unitPrice: { amount: "0.01" } }],
  },
  entitlementTemplate: {
    type: "metered",
    issueAfterReset: 10,
    usagePeriod: "PT1H",
  },
});

const makeSubscription = (
  plan: SubscriptionPlan,
  overrides: Partial<Subscription> = {},
): Subscription => ({
  activeFrom: "2026-05-27T14:30:00.000Z",
  alignment: {
    billablesMustAlign: true,
    currentAlignedBillingPeriod: {
      from: "2026-06-03T13:00:00.000Z",
      to: "2026-06-03T14:00:00.000Z",
    },
  },
  billingAnchor: "2026-05-27T14:30:00.000Z",
  billingCadence: plan.billingCadence,
  createdAt: "2026-05-27T14:30:00.000Z",
  currency: "USD",
  customerId: "cust-1",
  id: "sub-1",
  metadata: {},
  name: plan.name,
  phases: [],
  plan,
  proRatingConfig: { enabled: true, mode: "max_consumption_based" },
  status: "active",
  updatedAt: "2026-05-27T14:30:00.000Z",
  consumer: {
    id: "consumer-1",
    name: "Consumer",
    createdOn: "2026-05-27T14:30:00.000Z",
    updatedOn: "2026-05-27T14:30:00.000Z",
    tags: {},
    metadata: {},
    apiKeys: [],
    managers: [],
  },
  ...overrides,
});

describe("SubscriptionPlanDetails", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the plan name, description and subscription ID", () => {
    render(
      <SubscriptionPlanDetails
        subscription={makeSubscription(
          makePlan({
            description: "The plan",
            phases: [phase([flatFeeCard("49")])],
          }),
        )}
      />,
    );

    expect(screen.getByText("Plan name")).toBeInTheDocument();
    expect(screen.getByText("The plan")).toBeInTheDocument();
    expect(screen.getByText("Subscription ID")).toBeInTheDocument();
    expect(screen.getByText("sub-1")).toBeInTheDocument();
  });

  it("renders 'Active since' and 'Current period' with the time of day, not just the date", () => {
    render(
      <SubscriptionPlanDetails
        subscription={makeSubscription(
          makePlan({ phases: [phase([flatFeeCard("49")])] }),
        )}
      />,
    );

    const activeSince = screen.getByText("Active since").nextElementSibling;
    expect(activeSince?.textContent).toMatch(/\d{1,2}:\d{2}/);

    const currentPeriod = screen.getByText("Current period").nextElementSibling;
    // Both boundaries fall on the same calendar day (hourly plan); the time
    // is what disambiguates them.
    expect(currentPeriod?.textContent).toMatch(
      /\d{1,2}:\d{2}.*–.*\d{1,2}:\d{2}/,
    );
  });

  it("renders the price per billing cadence for a flat plan", () => {
    render(
      <SubscriptionPlanDetails
        subscription={makeSubscription(
          makePlan({ phases: [phase([flatFeeCard("49")])] }),
        )}
      />,
    );

    expect(screen.getByText("$49")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();
  });

  it("renders 'Free' for a zero flat fee", () => {
    render(
      <SubscriptionPlanDetails
        subscription={makeSubscription(
          makePlan({ phases: [phase([flatFeeCard("0")])] }),
        )}
      />,
    );

    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  // The reported bug: a usage-based plan showed only "Pay as you go" and
  // "10 / hour" with no actual price. It must now surface "$3 + $0.01/request"
  // in the entitlements, consistent with the pricing card.
  it("shows the per-unit price for a usage-based (single-tier tiered) plan", () => {
    render(
      <SubscriptionPlanDetails
        subscription={makeSubscription(
          makePlan({
            key: "test_single_tier_tiered",
            name: "test_single_tier_tiered",
            billingCadence: "PT1H",
            phases: [phase([singleTierUsageCard()])],
          }),
        )}
      />,
    );

    expect(screen.getByText("Pay as you go")).toBeInTheDocument();
    expect(screen.getByText("Usage-based pricing")).toBeInTheDocument();

    const included = screen.getByText("What's included");
    const section = included.parentElement as HTMLElement;
    expect(within(section).getByText("API Requests")).toBeInTheDocument();
    expect(
      within(section).getByText(/\$3 \+ \$0\.01\/request/),
    ).toBeInTheDocument();
  });

  it("renders an included quota with its reset period for a free metered card", () => {
    const freeQuotaCard: RateCard = {
      type: "usage_based",
      key: "api_requests",
      name: "API Requests",
      featureKey: "api_requests",
      billingCadence: "PT1H",
      price: null,
      entitlementTemplate: {
        type: "metered",
        issueAfterReset: 10,
        usagePeriod: "PT1H",
      },
    };

    render(
      <SubscriptionPlanDetails
        subscription={makeSubscription(
          makePlan({
            billingCadence: "PT1H",
            phases: [phase([freeQuotaCard])],
          }),
        )}
      />,
    );

    expect(screen.getByText("API Requests:")).toBeInTheDocument();
    expect(screen.getByText(/10 \/ hour/)).toBeInTheDocument();
  });

  it("shows a subscription tax legend under Price when plan.defaultTaxConfig.behavior is set", () => {
    render(
      <SubscriptionPlanDetails
        subscription={makeSubscription(
          makePlan({
            phases: [phase([flatFeeCard("49")])],
            defaultTaxConfig: { behavior: "exclusive" },
          }),
        )}
      />,
    );

    expect(
      screen.getByText(
        "Price excludes tax; taxes may be added on invoice if applicable.",
      ),
    ).toBeInTheDocument();
  });

  it("does not render a tax legend for unsupported behavior values", () => {
    render(
      <SubscriptionPlanDetails
        subscription={makeSubscription(
          makePlan({
            phases: [phase([flatFeeCard("49")])],
            defaultTaxConfig: { behavior: "NONE" },
          }),
        )}
      />,
    );

    expect(screen.queryByText(/Price excludes tax;/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Price includes tax/i)).not.toBeInTheDocument();
  });

  // Prefer the subscription's actual provisioned items for BOTH price and
  // entitlements, so a paid plan never reads as "Free" and the real quota
  // shows even if the embedded plan snapshot is thin.
  it("derives price and entitlements from the active phase's items when present", () => {
    const subscription = makeSubscription(makePlan({ phases: [] }), {
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
              featureKey: "monthly_fee",
              id: "fee",
              included: {
                feature: {
                  createdAt: "x",
                  id: "mf",
                  key: "monthly_fee",
                  name: "Monthly Fee",
                  updatedAt: "x",
                },
              },
              key: "monthly_fee",
              metadata: {},
              name: "Monthly Fee",
              price: { type: "flat", amount: "49", paymentTerm: "in_advance" },
              updatedAt: "2026-04-01T12:00:00.000Z",
            },
            {
              activeFrom: "2026-04-01T12:00:00.000Z",
              billingCadence: "P1M",
              createdAt: "2026-04-01T12:00:00.000Z",
              featureKey: "api_requests",
              id: "api",
              included: {
                entitlement: {
                  activeFrom: "2026-04-01T12:00:00.000Z",
                  annotations: { "subscription.id": "sub-1" },
                  createdAt: "2026-04-01T12:00:00.000Z",
                  featureId: "f",
                  featureKey: "api_requests",
                  id: "ent",
                  issueAfterReset: 500,
                  subjectKey: "s",
                  type: "metered",
                  updatedAt: "2026-04-01T12:00:00.000Z",
                  usagePeriod: {
                    anchor: "x",
                    interval: "P1M",
                    intervalISO: "P1M",
                  },
                },
                feature: {
                  createdAt: "x",
                  id: "f",
                  key: "api_requests",
                  name: "API Requests",
                  updatedAt: "x",
                },
              },
              key: "api_requests",
              metadata: {},
              name: "API Requests",
              updatedAt: "2026-04-01T12:00:00.000Z",
            },
          ],
          key: "default",
          metadata: {},
          name: "Default",
          updatedAt: "2026-04-01T12:00:00.000Z",
        },
      ],
    });

    render(<SubscriptionPlanDetails subscription={subscription} />);

    expect(screen.getByText("$49")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();
    expect(screen.getByText("API Requests:")).toBeInTheDocument();
    expect(screen.getByText(/500 \/ month/)).toBeInTheDocument();
  });

  // A two-phase ramp subscription ("$375/month for 3 months, then
  // $750/month"): the Price field must show the phase that is active NOW,
  // not the future steady phase and not the catalog plan's last phase.
  it("shows the active intro phase's price for a multi-phase subscription", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-15T00:00:00.000Z"));

    const feeItem = (
      id: string,
      amount: string,
    ): Subscription["phases"][number]["items"][number] =>
      ({
        activeFrom: "2026-06-04T00:00:00.000Z",
        billingCadence: "P1M",
        createdAt: "2026-06-04T00:00:00.000Z",
        featureKey: "monthly_fee",
        id,
        included: {},
        key: "monthly_fee",
        metadata: {},
        name: "Monthly Fee",
        price: { type: "flat", amount, paymentTerm: "in_advance" },
        updatedAt: "2026-06-04T00:00:00.000Z",
      }) as unknown as Subscription["phases"][number]["items"][number];

    const subPhase = (o: {
      key: string;
      activeFrom: string;
      activeTo?: string;
      items: Subscription["phases"][number]["items"];
    }): Subscription["phases"][number] =>
      ({
        activeFrom: o.activeFrom,
        activeTo: o.activeTo,
        createdAt: o.activeFrom,
        id: `phase-${o.key}`,
        itemTimelines: {},
        items: o.items,
        key: o.key,
        metadata: {},
        name: o.key,
        updatedAt: o.activeFrom,
      }) as unknown as Subscription["phases"][number];

    // The catalog plan's steady-state phase says $750 — it must NOT win
    // over the provisioned intro item.
    const subscription = makeSubscription(
      makePlan({ phases: [phase([flatFeeCard("750")])] }),
      {
        phases: [
          subPhase({
            key: "intro",
            activeFrom: "2026-06-04T00:00:00.000Z",
            activeTo: "2026-09-04T00:00:00.000Z",
            items: [feeItem("fee-intro", "375")],
          }),
          subPhase({
            key: "steady",
            activeFrom: "2026-09-04T00:00:00.000Z",
            items: [feeItem("fee-steady", "750")],
          }),
        ],
      },
    );

    render(<SubscriptionPlanDetails subscription={subscription} />);

    // The "Price" field shows the phase active NOW ($375), never the future
    // steady phase or the catalog plan's last phase.
    const priceField = screen.getByText("Price").parentElement as HTMLElement;
    expect(within(priceField).getByText("$375")).toBeInTheDocument();
    expect(within(priceField).getByText("/month")).toBeInTheDocument();
    expect(within(priceField).queryByText("$750")).not.toBeInTheDocument();

    // The future steady phase ($750/month) is surfaced under "Upcoming phases".
    const upcoming = screen.getByText("Upcoming phases")
      .parentElement as HTMLElement;
    expect(within(upcoming).getByText("$750")).toBeInTheDocument();
  });
});
