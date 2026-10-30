import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanPriceTag } from "./PlanPriceTag.js";

describe("PlanPriceTag", () => {
  it("renders a priced label as amount + /cadence", () => {
    render(
      <PlanPriceTag
        label={{ type: "priced", amount: 45 }}
        currency="USD"
        billingCadence="P1M"
      />,
    );

    expect(screen.getByText("$45")).toBeInTheDocument();
    expect(screen.getByText("/month")).toBeInTheDocument();
  });

  it("omits the cadence suffix when no billingCadence is given", () => {
    render(
      <PlanPriceTag label={{ type: "priced", amount: 45 }} currency="USD" />,
    );

    expect(screen.getByText("$45")).toBeInTheDocument();
    expect(screen.queryByText(/^\//)).not.toBeInTheDocument();
  });

  it("renders a payg label without the subline by default", () => {
    render(
      <PlanPriceTag
        label={{
          type: "payg",
          main: "Pay as you go",
          sub: "Usage-based pricing",
        }}
      />,
    );

    expect(screen.getByText("Pay as you go")).toBeInTheDocument();
    expect(screen.queryByText("Usage-based pricing")).not.toBeInTheDocument();
  });

  it("renders the payg subline when `description` is set", () => {
    render(
      <PlanPriceTag
        label={{
          type: "payg",
          main: "Pay as you go",
          sub: "Usage-based pricing",
        }}
        description
      />,
    );

    expect(screen.getByText("Pay as you go")).toBeInTheDocument();
    expect(screen.getByText("Usage-based pricing")).toBeInTheDocument();
  });

  it("renders 'Free' for a free label", () => {
    render(<PlanPriceTag label={{ type: "free" }} />);

    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("renders a large headline amount in lg size", () => {
    render(
      <PlanPriceTag
        label={{ type: "priced", amount: 45 }}
        currency="USD"
        size="lg"
      />,
    );

    const amount = screen.getByText("$45");
    expect(amount).toBeInTheDocument();
    expect(amount).toHaveClass("text-2xl", "font-bold");
  });

  it("shows the payg subline in lg size only when `description` is set", () => {
    const { rerender } = render(
      <PlanPriceTag
        label={{
          type: "payg",
          main: "Pay as you go",
          sub: "Usage-based pricing",
        }}
        size="lg"
      />,
    );
    expect(screen.queryByText("Usage-based pricing")).not.toBeInTheDocument();

    rerender(
      <PlanPriceTag
        label={{
          type: "payg",
          main: "Pay as you go",
          sub: "Usage-based pricing",
        }}
        size="lg"
        description
      />,
    );
    expect(screen.getByText("Usage-based pricing")).toBeInTheDocument();
  });
});
