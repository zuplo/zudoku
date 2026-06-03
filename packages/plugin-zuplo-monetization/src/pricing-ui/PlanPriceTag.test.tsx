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
});
