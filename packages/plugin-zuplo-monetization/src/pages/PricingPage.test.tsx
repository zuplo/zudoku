import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Plan } from "../types/PlanType.js";
import PricingPage from "./PricingPage.js";

vi.mock("zudoku/components", async (importOriginal) => ({
  ...(await importOriginal()),
  Head: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

describe("PricingPage", () => {
  it("Shows 'Manage Subscriptions' if the user has any active subscriptions", () => {
    mockPricingData.items = [
      makePlan("1", "starter", "Starter"),
      makePlan("2", "pro", "Pro"),
      makePlan("3", "business", "Business"),
    ];
    mockSubscriptionData.items = [{ status: "active", plan: { id: "2" } }];

    render(<PricingPage />);

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

    render(<PricingPage />);

    const buttons = screen.getAllByText("Subscribe");
    expect(buttons).toHaveLength(3);
  });
});
