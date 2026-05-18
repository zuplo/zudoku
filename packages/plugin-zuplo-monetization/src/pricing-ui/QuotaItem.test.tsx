import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Quota } from "../types/PlanType.js";
import { QuotaItem } from "./QuotaItem.js";

describe("QuotaItem", () => {
  it("renders quota name, limit, and period", () => {
    const quota: Quota = {
      key: "api-calls",
      name: "API Calls",
      limit: 1000,
      period: "month",
    };
    render(<QuotaItem quota={quota} />);
    expect(screen.getByText("API Calls:")).toBeInTheDocument();
    expect(screen.getByText(/1,000/)).toBeInTheDocument();
    expect(screen.getByText(/month/)).toBeInTheDocument();
  });

  it("renders overage price when present", () => {
    const quota: Quota = {
      key: "api-calls",
      name: "API Calls",
      limit: 1000,
      period: "month",
      overagePrice: "$0.01/unit",
    };
    render(<QuotaItem quota={quota} />);
    expect(screen.getByText(/\+\$0\.01\/unit after quota/)).toBeInTheDocument();
  });

  it("does not render overage text when no overage price", () => {
    const quota: Quota = {
      key: "api-calls",
      name: "API Calls",
      limit: 500,
      period: "month",
    };
    render(<QuotaItem quota={quota} />);
    expect(screen.queryByText(/after quota/)).not.toBeInTheDocument();
  });

  it("renders PAYG quota with unit price and omits 'limit / period'", () => {
    const quota: Quota = {
      key: "api-calls",
      name: "API Calls",
      limit: 0,
      period: "month",
      isPayg: true,
      unitPrice: "$0.10/unit",
    };
    render(<QuotaItem quota={quota} />);
    expect(screen.getByText("API Calls")).toBeInTheDocument();
    expect(screen.getByText(/\$0\.10\/unit/)).toBeInTheDocument();
    expect(screen.queryByText(/0 \/ month/)).not.toBeInTheDocument();
  });

  it("renders PAYG quota with tier breakdown lines", () => {
    const quota: Quota = {
      key: "api-calls",
      name: "API Calls",
      limit: 0,
      period: "month",
      isPayg: true,
      tierPrices: ["Up to 10,000: $0.10/unit", "Over 10,000: $0.01/unit"],
    };
    render(<QuotaItem quota={quota} />);
    expect(screen.getByText("API Calls")).toBeInTheDocument();
    expect(screen.getByText("Up to 10,000: $0.10/unit")).toBeInTheDocument();
    expect(screen.getByText("Over 10,000: $0.01/unit")).toBeInTheDocument();
  });
});
