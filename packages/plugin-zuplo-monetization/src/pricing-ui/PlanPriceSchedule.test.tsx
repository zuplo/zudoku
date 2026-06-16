import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanPriceSchedule } from "./PlanPriceSchedule.js";

const ramp = [
  { key: "intro", label: "First 3 months", price: { type: "free" } as const },
  {
    key: "main",
    label: "After that",
    price: { type: "priced", amount: 750 } as const,
    billingCadence: "P1M",
  },
];

describe("PlanPriceSchedule", () => {
  it("renders one row per schedule entry with label and price", () => {
    render(<PlanPriceSchedule schedule={ramp} currency="USD" />);

    expect(screen.getByText("First 3 months")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("After that")).toBeInTheDocument();
    expect(screen.getByText("$750")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();
  });

  it("renders a priced intro row", () => {
    render(
      <PlanPriceSchedule
        schedule={[
          {
            ...ramp[0],
            price: { type: "priced", amount: 375 },
            billingCadence: "P1M",
          },
          ramp[1],
        ]}
        currency="USD"
      />,
    );

    expect(screen.getByText("$375")).toBeInTheDocument();
    expect(screen.getByText("$750")).toBeInTheDocument();
    expect(screen.getAllByText("/month")).toHaveLength(2);
  });

  it("suffixes each row with its own cadence", () => {
    // An hourly trial ramping into a daily plan: rows carry different
    // cadences, so the suffixes must differ ("/hour" vs "/day").
    render(
      <PlanPriceSchedule
        schedule={[
          {
            key: "trial",
            label: "First hour",
            price: { type: "priced", amount: 1 },
            billingCadence: "PT1H",
          },
          {
            key: "main",
            label: "After that",
            price: { type: "priced", amount: 2.99 },
            billingCadence: "P1D",
          },
        ]}
        currency="USD"
      />,
    );

    expect(screen.getByText("/hour")).toBeInTheDocument();
    expect(screen.getByText("/day")).toBeInTheDocument();
    expect(screen.queryByText("/month")).not.toBeInTheDocument();
  });

  it("renders 'Pay as you go' for a payg row", () => {
    render(
      <PlanPriceSchedule
        schedule={[
          {
            key: "intro",
            label: "First month",
            price: {
              type: "payg",
              main: "Pay as you go",
              sub: "Usage-based pricing",
            },
          },
          ramp[1],
        ]}
        currency="USD"
      />,
    );

    expect(screen.getByText("Pay as you go")).toBeInTheDocument();
    expect(screen.queryByText("Usage-based pricing")).not.toBeInTheDocument();
  });

  it("gives every row's price equal visual weight", () => {
    render(<PlanPriceSchedule schedule={ramp} currency="USD" />);

    expect(screen.getByText("Free")).toHaveClass("font-semibold");
    expect(screen.getByText("$750")).toHaveClass("font-semibold");
  });

  it("omits the cadence suffix when a row has no billingCadence", () => {
    render(
      <PlanPriceSchedule
        schedule={[
          ramp[0],
          {
            key: "main",
            label: "After that",
            price: { type: "priced", amount: 750 },
          },
        ]}
        currency="USD"
      />,
    );

    expect(screen.getByText("$750")).toBeInTheDocument();
    expect(screen.queryByText(/^\//)).not.toBeInTheDocument();
  });
});
