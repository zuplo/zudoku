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
});
