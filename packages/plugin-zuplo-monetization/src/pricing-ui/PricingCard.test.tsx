import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Plan, PlanPhase } from "../types/PlanType.js";
import { PricingCard } from "./PricingCard.js";

const phase = (overrides: Partial<PlanPhase> = {}): PlanPhase => ({
  key: "default",
  name: "Default",
  rateCards: [],
  ...overrides,
});

const plan = (overrides: Partial<Plan> = {}): Plan => ({
  id: "plan_1",
  key: "p",
  name: "Pro",
  billingCadence: "P1M",
  currency: "USD",
  phases: [phase()],
  monthlyPrice: null,
  yearlyPrice: null,
  ...overrides,
});

describe("PricingCard", () => {
  it("renders nothing when the plan has no phases", () => {
    const { container } = render(<PricingCard plan={plan({ phases: [] })} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the plan name as the card header", () => {
    render(<PricingCard plan={plan({ name: "Scale" })} />);
    expect(screen.getByRole("heading", { name: "Scale" })).toBeInTheDocument();
  });

  it("renders 'Free' when the plan has no priced rate cards", () => {
    render(<PricingCard plan={plan()} />);
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("renders the monthly price and billing interval for a priced plan", () => {
    render(
      <PricingCard plan={plan({ monthlyPrice: "29", yearlyPrice: "348" })} />,
    );
    expect(screen.getByText("$29")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();
  });

  it("renders the yearly price when showYearlyPrice is true (default)", () => {
    render(
      <PricingCard plan={plan({ monthlyPrice: "29", yearlyPrice: "348" })} />,
    );
    expect(screen.getByText("$348/year")).toBeInTheDocument();
  });

  it("hides the yearly price line when showYearlyPrice is false", () => {
    render(
      <PricingCard
        plan={plan({ monthlyPrice: "29", yearlyPrice: "348" })}
        showYearlyPrice={false}
      />,
    );
    expect(screen.queryByText("$348/year")).not.toBeInTheDocument();
  });

  it("hides the yearly price line when yearly is 0", () => {
    render(
      <PricingCard plan={plan({ monthlyPrice: "29", yearlyPrice: "0" })} />,
    );
    expect(screen.queryByText(/\$0\/year/)).not.toBeInTheDocument();
  });

  it("renders 'Pay as you go / Usage-based pricing' for a PAYG plan", () => {
    const paygPlan = plan({
      monthlyPrice: null,
      yearlyPrice: null,
      phases: [
        phase({
          rateCards: [
            {
              type: "usage_based",
              key: "api",
              name: "API",
              billingCadence: "P1M",
              price: { type: "unit", amount: "0.10" },
              entitlementTemplate: { type: "metered", isSoftLimit: true },
            },
          ],
        }),
      ],
    });
    render(<PricingCard plan={paygPlan} />);
    expect(screen.getByText("Pay as you go")).toBeInTheDocument();
    expect(screen.getByText("Usage-based pricing")).toBeInTheDocument();
  });

  it("renders 'Custom / Contact Sales' when metadata.isCustom is true", () => {
    render(<PricingCard plan={plan({ metadata: { isCustom: true } })} />);
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.getByText("Contact Sales")).toBeInTheDocument();
  });

  it("renders the 'Most Popular' badge when isPopular is true", () => {
    render(<PricingCard plan={plan()} isPopular />);
    expect(screen.getByText("Most Popular")).toBeInTheDocument();
  });

  it("does not render the 'Most Popular' badge by default", () => {
    render(<PricingCard plan={plan()} />);
    expect(screen.queryByText("Most Popular")).not.toBeInTheDocument();
  });

  it("renders 'No CC required' when paymentRequired is explicitly false", () => {
    render(<PricingCard plan={plan({ paymentRequired: false })} />);
    expect(screen.getByText("No CC required")).toBeInTheDocument();
  });

  it("does not render 'No CC required' when paymentRequired is unset or true", () => {
    const { rerender } = render(<PricingCard plan={plan()} />);
    expect(screen.queryByText("No CC required")).not.toBeInTheDocument();
    rerender(<PricingCard plan={plan({ paymentRequired: true })} />);
    expect(screen.queryByText("No CC required")).not.toBeInTheDocument();
  });

  it("renders the action slot at the bottom of the card", () => {
    render(
      <PricingCard
        plan={plan()}
        action={<button type="button">Subscribe</button>}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Subscribe" }),
    ).toBeInTheDocument();
  });

  it("renders entitlements from each rate card on the steady-state phase", () => {
    const planWithFeatures = plan({
      phases: [
        phase({
          rateCards: [
            {
              type: "flat_fee",
              key: "support",
              name: "Priority Support",
              billingCadence: null,
              price: null,
              entitlementTemplate: { type: "boolean" },
            },
            {
              type: "usage_based",
              key: "api",
              name: "API Calls",
              billingCadence: "P1M",
              price: null,
              entitlementTemplate: {
                type: "metered",
                issueAfterReset: 10000,
              },
            },
          ],
        }),
      ],
    });
    render(<PricingCard plan={planWithFeatures} />);
    expect(screen.getByText("Priority Support")).toBeInTheDocument();
    expect(screen.getByText("API Calls:")).toBeInTheDocument();
    expect(screen.getByText(/10,000/)).toBeInTheDocument();
  });
});
