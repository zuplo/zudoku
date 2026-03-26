import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  MonetizationContext,
  type MonetizationConfig,
} from "../MonetizationContext.js";
import type { Plan } from "../types/PlanType.js";
import PricingPage from "./PricingPage.js";

vi.mock("zudoku/components", async (importOriginal) => ({
  ...(await importOriginal()),
  Head: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Slot: {
    Target: () => null,
    Source: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}));

vi.mock("zudoku/router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("zudoku/hooks", () => ({
  useAuth: () => ({ isAuthenticated: false }),
  useZudoku: () => ({ env: { ZUPLO_PUBLIC_DEPLOYMENT_NAME: "test-env" } }),
}));

const mockPricingData: { items: Plan[] } = { items: [] };
const mockSubscriptionData: {
  items: Array<{ status: string; plan: { id: string } }>;
} = { items: [] };

vi.mock("zudoku/react-query", () => ({
  useSuspenseQuery: () => ({ data: mockPricingData }),
  useQuery: () => ({ data: mockSubscriptionData }),
}));

vi.mock("../hooks/useDeploymentName", () => ({
  useDeploymentName: () => "test-deployment",
}));

const makePlan = (id: string, key: string, name: string): Plan => ({
  id,
  key,
  name,
  billingCadence: "P1M",
  phases: [
    {
      key: "default",
      name: "Default",
      rateCards: [
        {
          type: "flat_fee",
          key: "base-fee",
          name: "Base Fee",
          billingCadence: "P1M",
          price: { type: "flat", amount: "49" },
        },
      ],
    },
  ],
  monthlyPrice: "49",
  yearlyPrice: "49",
  currency: "USD",
});

const renderWithConfig = (config: MonetizationConfig = {}) =>
  render(
    <MonetizationContext value={config}>
      <PricingPage />
    </MonetizationContext>,
  );

describe("PricingPage", () => {
  it("Shows 'Manage Subscriptions' if the user has any active subscriptions", () => {
    mockPricingData.items = [
      makePlan("1", "starter", "Starter"),
      makePlan("2", "pro", "Pro"),
      makePlan("3", "business", "Business"),
    ];
    mockSubscriptionData.items = [{ status: "active", plan: { id: "2" } }];

    renderWithConfig();

    const buttons = screen.getAllByText("Manage Subscriptions");
    expect(buttons).toHaveLength(3);
  });

  it("Shows 'Subscribe' if the user has no subscriptions", () => {
    mockPricingData.items = [
      makePlan("1", "starter", "Starter"),
      makePlan("2", "pro", "Pro"),
      makePlan("3", "business", "Business"),
    ];
    mockSubscriptionData.items = [];

    renderWithConfig();

    const buttons = screen.getAllByText("Subscribe");
    expect(buttons).toHaveLength(3);
  });

  it("Shows 'no cc required' if no rate card has 'in_advance' fee with 'amount=0'", () => {
    mockPricingData.items = [
      {
        ...makePlan("1", "free", "Free"),
        monthlyPrice: "0",
        paymentRequired: false,
        yearlyPrice: "0",
        phases: [
          {
            key: "default",
            name: "Default",
            rateCards: [
              {
                type: "flat_fee",
                key: "base-fee",
                name: "Base Fee",
                billingCadence: "P1M",
                price: { type: "flat", amount: "0" },
              },
            ],
          },
        ],
      },
    ];
    mockSubscriptionData.items = [];

    renderWithConfig();

    expect(screen.getByText("No CC required")).toBeInTheDocument();
  });

  it("Does not show 'no cc required' if any rate card has 'in_advance' fee", () => {
    mockPricingData.items = [
      {
        ...makePlan("1", "starter", "Starter"),
        paymentRequired: true,
        phases: [
          {
            key: "default",
            name: "Default",
            rateCards: [
              {
                type: "flat_fee",
                key: "base-fee",
                name: "Base Fee",
                billingCadence: "P1M",
                price: {
                  type: "flat",
                  amount: "49",
                  paymentTerm: "in_advance",
                },
              },
            ],
          },
        ],
      },
    ];
    mockSubscriptionData.items = [];

    renderWithConfig();

    expect(screen.queryByText("No CC required")).not.toBeInTheDocument();
  });

  it("Shows 'Most Popular' badge when plan.metadata.zuplo_most_popular is 'true'", () => {
    mockPricingData.items = [
      makePlan("1", "starter", "Starter"),
      {
        ...makePlan("2", "pro", "Pro"),
        metadata: { zuplo_most_popular: "true" },
      },
      makePlan("3", "business", "Business"),
    ];
    mockSubscriptionData.items = [];

    renderWithConfig();

    expect(screen.getByText("Most Popular")).toBeInTheDocument();
  });

  it("Shows custom unit label in overage price when units config is provided", () => {
    mockPricingData.items = [
      {
        ...makePlan("1", "pro", "Pro"),
        phases: [
          {
            key: "default",
            name: "Default",
            rateCards: [
              {
                type: "usage_based",
                key: "api-requests",
                name: "API Requests",
                billingCadence: "P1M",
                price: {
                  type: "tiered",
                  mode: "graduated",
                  tiers: [
                    { flatPrice: { amount: "0" }, upToAmount: "1000" },
                    {
                      flatPrice: { amount: "0" },
                      unitPrice: { amount: "0.001" },
                    },
                  ],
                },
                entitlementTemplate: {
                  type: "metered",
                  issueAfterReset: 1000,
                  isSoftLimit: true,
                },
              },
            ],
          },
        ],
      },
    ];
    mockSubscriptionData.items = [];

    renderWithConfig({
      pricing: { units: { "api-requests": "request" } },
    });

    expect(screen.getByText(/\/request after quota/)).toBeInTheDocument();
  });

  it("Shows yearly price by default", () => {
    mockPricingData.items = [makePlan("1", "starter", "Starter")];
    mockSubscriptionData.items = [];

    renderWithConfig();

    expect(screen.getByText(/\/year/)).toBeInTheDocument();
  });

  it("Hides yearly price when showYearlyPrice is false", () => {
    mockPricingData.items = [makePlan("1", "starter", "Starter")];
    mockSubscriptionData.items = [];

    renderWithConfig({ pricing: { showYearlyPrice: false } });

    expect(screen.queryByText(/\/year/)).not.toBeInTheDocument();
  });

  it("Shows billing interval from plan.billingCadence", () => {
    mockPricingData.items = [
      {
        ...makePlan("1", "starter", "Starter"),
        billingCadence: "P1W",
      },
    ];
    mockSubscriptionData.items = [];

    renderWithConfig();

    expect(screen.getByText("/week")).toBeInTheDocument();
    expect(screen.queryByText("/mo")).not.toBeInTheDocument();
  });

  it("Does not show 'Most Popular' badge when plan.metadata.zuplo_most_popular is not 'true' or missing", () => {
    mockPricingData.items = [
      makePlan("1", "starter", "Starter"),
      {
        ...makePlan("2", "pro", "Pro"),
        metadata: { zuplo_most_popular: "false" },
      },
      makePlan("3", "business", "Business"),
    ];
    mockSubscriptionData.items = [];

    renderWithConfig();

    expect(screen.queryByText("Most Popular")).not.toBeInTheDocument();
  });
});
