import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Plan } from "../types/PlanType.js";
import PricingPage from "./PricingPage.js";

// Head is Helmet from react-helmet-async which requires a HelmetProvider.
// That provider isn't exported by zudoku, so we stub Head as a passthrough.
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
});

describe("PricingPage", () => {
  it("renders 3 cards for 3 plans", () => {
    mockPricingData.items = [
      makePlan("1", "starter", "Starter"),
      makePlan("2", "pro", "Pro"),
      makePlan("3", "business", "Business"),
    ];

    render(<PricingPage />);

    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Business")).toBeInTheDocument();
  });

  it("renders 1 card for 1 plan", () => {
    mockPricingData.items = [makePlan("1", "starter", "Starter")];

    render(<PricingPage />);

    expect(screen.getByText("Starter")).toBeInTheDocument();
  });

  it("shows Already subscribed on all buttons when user has any active subscriptions", () => {
    mockPricingData.items = [
      makePlan("1", "starter", "Starter"),
      makePlan("2", "pro", "Pro"),
      makePlan("3", "business", "Business"),
    ];
    mockSubscriptionData.items = [
      { status: "active", plan: { id: "1" } },
      // { status: "active", plan: { id: "2" } },
      // { status: "active", plan: { id: "3" } },
    ];

    render(<PricingPage />);

    const buttons = screen.getAllByRole("button", {
      name: "Already subscribed",
    });
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
    expect(screen.queryByText("Subscribe")).not.toBeInTheDocument();
  });
});
