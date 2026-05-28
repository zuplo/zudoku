import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Plan, PlanPhase } from "../types/PlanType.js";
import { PricingTable } from "./PricingTable.js";

const phase = (overrides: Partial<PlanPhase> = {}): PlanPhase => ({
  key: "default",
  name: "Default",
  rateCards: [],
  ...overrides,
});

const plan = (overrides: Partial<Plan> = {}): Plan => ({
  id: "plan_1",
  key: "p",
  name: "Plan",
  billingCadence: "P1M",
  currency: "USD",
  phases: [phase()],
  monthlyPrice: null,
  yearlyPrice: null,
  ...overrides,
});

describe("PricingTable", () => {
  it("renders the default empty state when there are no plans", () => {
    render(<PricingTable plans={[]} />);
    expect(
      screen.getByText("No plans are currently available."),
    ).toBeInTheDocument();
  });

  it("renders a custom emptyState when provided", () => {
    render(<PricingTable plans={[]} emptyState={<div>Coming soon!</div>} />);
    expect(screen.getByText("Coming soon!")).toBeInTheDocument();
    expect(
      screen.queryByText("No plans are currently available."),
    ).not.toBeInTheDocument();
  });

  it("renders a card per plan", () => {
    render(
      <PricingTable
        plans={[
          plan({ id: "a", name: "Free" }),
          plan({ id: "b", name: "Pro", monthlyPrice: "29" }),
          plan({ id: "c", name: "Enterprise", monthlyPrice: "199" }),
        ]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Free" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pro" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Enterprise" }),
    ).toBeInTheDocument();
  });

  it("uses the default isPopular predicate (metadata.zuplo_most_popular === 'true')", () => {
    render(
      <PricingTable
        plans={[
          plan({ id: "a", name: "Free" }),
          plan({
            id: "b",
            name: "Pro",
            metadata: { zuplo_most_popular: "true" },
          }),
        ]}
      />,
    );
    expect(screen.getByText("Most Popular")).toBeInTheDocument();
  });

  it("honours a custom isPopular predicate", () => {
    render(
      <PricingTable
        plans={[
          plan({ id: "a", name: "Free" }),
          plan({ id: "b", name: "Pro" }),
        ]}
        isPopular={(p) => p.name === "Pro"}
      />,
    );
    expect(screen.getByText("Most Popular")).toBeInTheDocument();
  });

  it("renders the action per plan via renderAction", () => {
    const renderAction = vi.fn((p: Plan) => (
      <button type="button">Subscribe to {p.name}</button>
    ));
    render(
      <PricingTable
        plans={[
          plan({ id: "a", name: "Free" }),
          plan({ id: "b", name: "Pro" }),
        ]}
        renderAction={renderAction}
      />,
    );
    expect(renderAction).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole("button", { name: "Subscribe to Free" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Subscribe to Pro" }),
    ).toBeInTheDocument();
  });

  it("wraps each card via renderCard when provided", () => {
    render(
      <PricingTable
        plans={[plan({ id: "a", name: "Free" })]}
        renderCard={(p, { defaultCard }) => (
          <div data-testid={`wrap-${p.id}`}>{defaultCard}</div>
        )}
      />,
    );
    const wrapper = screen.getByTestId("wrap-a");
    expect(wrapper).toBeInTheDocument();
    expect(
      within(wrapper).getByRole("heading", { name: "Free" }),
    ).toBeInTheDocument();
  });

  it("renders the tax legend when the first plan has a default tax behavior", () => {
    render(
      <PricingTable
        plans={[
          plan({
            id: "a",
            name: "Pro",
            defaultTaxConfig: { behavior: "exclusive" },
          }),
        ]}
      />,
    );
    expect(
      screen.getByText(
        "Prices exclude tax; taxes may be added at checkout if applicable.",
      ),
    ).toBeInTheDocument();
  });

  it("does not render the tax legend when showTaxLegend is false", () => {
    render(
      <PricingTable
        plans={[
          plan({
            id: "a",
            name: "Pro",
            defaultTaxConfig: { behavior: "exclusive" },
          }),
        ]}
        showTaxLegend={false}
      />,
    );
    expect(screen.queryByText(/Prices exclude tax/)).not.toBeInTheDocument();
  });

  it("does not render the tax legend when no plan has a tax behavior", () => {
    render(<PricingTable plans={[plan({ id: "a" })]} />);
    expect(
      screen.queryByText(/Prices (include|exclude)/),
    ).not.toBeInTheDocument();
  });

  it("passes showYearlyPrice and units through to each card", () => {
    const planWithUsage: Plan = plan({
      id: "a",
      monthlyPrice: "29",
      yearlyPrice: "348",
      phases: [
        phase({
          rateCards: [
            {
              type: "usage_based",
              key: "api",
              name: "API Calls",
              billingCadence: "P1M",
              price: { type: "unit", amount: "0.10" },
              entitlementTemplate: { type: "metered", isSoftLimit: true },
            },
          ],
        }),
      ],
    });
    render(
      <PricingTable
        plans={[planWithUsage]}
        showYearlyPrice
        units={{ api: "request" }}
      />,
    );
    // Yearly price comes from showYearlyPrice on PricingCard.
    expect(screen.getByText("$348/year")).toBeInTheDocument();
    // Custom unit label comes from the `units` map.
    expect(screen.getByText(/\$0\.10\/request/)).toBeInTheDocument();
  });
});
