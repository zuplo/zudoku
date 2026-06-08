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
  ...overrides,
});

const flatFee = (
  amount: string,
  billingCadence = "P1M",
): PlanPhase["rateCards"][number] => ({
  type: "flat_fee",
  key: "base",
  name: "Base",
  billingCadence,
  price: { type: "flat", amount },
});

const pricedPlan = (amount: string, overrides: Partial<Plan> = {}): Plan => {
  // Keep the flat-fee rate card's cadence aligned with the plan's so the
  // fixture mirrors real data (e.g. an hourly plan carries an hourly card).
  const billingCadence = overrides.billingCadence ?? "P1M";
  return plan({
    ...overrides,
    billingCadence,
    phases: [phase({ rateCards: [flatFee(amount, billingCadence)] })],
  });
};

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

  it("renders the price and billing interval for a priced plan", () => {
    render(<PricingCard plan={pricedPlan("29")} />);
    expect(screen.getByText("$29")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();
  });

  // Regression: an hourly (sub-day) cadence flat fee used to render as "Free".
  it("renders the flat fee per hour for an hourly (PT1H) plan", () => {
    render(
      <PricingCard plan={pricedPlan("2.99", { billingCadence: "PT1H" })} />,
    );
    expect(screen.getByText("$2.99")).toBeInTheDocument();
    expect(screen.getByText("/hour")).toBeInTheDocument();
    expect(screen.queryByText("Free")).not.toBeInTheDocument();
  });

  it("does not render an annual price line for a priced plan", () => {
    render(<PricingCard plan={pricedPlan("29")} />);
    expect(screen.queryByText(/\/year/)).not.toBeInTheDocument();
  });

  it("renders 'Pay as you go / Usage-based pricing' for a PAYG plan", () => {
    const paygPlan = plan({
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

  // Mirrors the motivating "discounted intro" plan: a free first phase
  // (monthly_fee price: null) ramping into $750/month, with identical
  // entitlements in both phases.
  const rampPlan = (introFee: PlanPhase["rateCards"][number]): Plan => {
    const jobsQuota: PlanPhase["rateCards"][number] = {
      type: "flat_fee",
      key: "jobs",
      name: "Jobs",
      billingCadence: null,
      price: null,
      featureKey: "jobs",
      entitlementTemplate: {
        type: "metered",
        issueAfterReset: 500_000,
        usagePeriod: "P1M",
      },
    };
    return plan({
      phases: [
        phase({
          key: "intro",
          name: "First 3 months",
          duration: "P3M",
          rateCards: [introFee, jobsQuota],
        }),
        phase({
          key: "main",
          name: "After 3 months",
          rateCards: [jobsQuota, flatFee("750")],
        }),
      ],
    });
  };

  it("renders a stacked price schedule for a multi-phase ramp plan", () => {
    render(
      <PricingCard
        plan={rampPlan({
          type: "flat_fee",
          key: "monthly_fee",
          name: "Monthly Fee",
          billingCadence: null,
          price: null,
        })}
      />,
    );

    expect(screen.getByText("First 3 months")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("After that")).toBeInTheDocument();
    expect(screen.getByText("$750")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();
    // Identical entitlements collapse into a single list without headers.
    expect(screen.getAllByText("Jobs:")).toHaveLength(1);
    expect(screen.queryByText("After 3 months")).not.toBeInTheDocument();
  });

  it("renders the intro price in the schedule once the intro fee is set", () => {
    render(<PricingCard plan={rampPlan(flatFee("375"))} />);

    expect(screen.getByText("$375")).toBeInTheDocument();
    expect(screen.getByText("$750")).toBeInTheDocument();
    expect(screen.queryByText("Free")).not.toBeInTheDocument();
  });

  it("keeps the single headline when all phases share the same price", () => {
    const samePricePlan = plan({
      phases: [
        phase({
          key: "intro",
          duration: "P3M",
          rateCards: [flatFee("750")],
        }),
        phase({ key: "main", rateCards: [flatFee("750")] }),
      ],
    });
    render(<PricingCard plan={samePricePlan} />);

    expect(screen.getByText("$750")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();
    expect(screen.queryByText("After that")).not.toBeInTheDocument();
  });

  it("renders 'Custom' instead of a schedule for a custom multi-phase plan", () => {
    const custom = rampPlan(flatFee("375"));
    render(<PricingCard plan={{ ...custom, metadata: { isCustom: true } }} />);

    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.getByText("Contact Sales")).toBeInTheDocument();
    expect(screen.queryByText("After that")).not.toBeInTheDocument();
  });
});
