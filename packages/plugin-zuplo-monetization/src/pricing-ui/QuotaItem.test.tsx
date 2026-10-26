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

  it("renders tier breakdown lines below the quota line", () => {
    const quota: Quota = {
      key: "api-calls",
      name: "API Calls",
      limit: 1000,
      period: "month",
      tierPrices: ["Over 1,000: $0.01/unit"],
    };
    render(<QuotaItem quota={quota} />);
    expect(screen.getByText("Over 1,000: $0.01/unit")).toBeInTheDocument();
    // The dedicated "after quota" line was removed; tier breakdown carries the info.
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

  it("hides the quota header when a breakdown is present without a hard cap", () => {
    const quota: Quota = {
      key: "api-calls",
      name: "API Calls",
      limit: 1000,
      period: "month",
      tierPrices: ["Up to 1,000: Included", "Over 1,000: $0.01/unit"],
    };
    render(<QuotaItem quota={quota} />);
    // The name renders without the "Name:" header form and no "X / period".
    expect(screen.queryByText("API Calls:")).not.toBeInTheDocument();
    expect(screen.queryByText(/1,000 \/ month/)).not.toBeInTheDocument();
    expect(screen.getByText("Up to 1,000: Included")).toBeInTheDocument();
  });

  it("shows the cap line alongside the breakdown for a hard cap", () => {
    const quota: Quota = {
      key: "api-calls",
      name: "API Calls",
      limit: 1000,
      period: "month",
      isHardCap: true,
      tierPrices: ["Up to 1,000: Included", "Over 1,000: $0.05/unit"],
    };
    render(<QuotaItem quota={quota} />);
    expect(screen.getByText("API Calls:")).toBeInTheDocument();
    expect(screen.getByText(/1,000 \/ month/)).toBeInTheDocument();
    expect(screen.getByText("Up to 1,000: Included")).toBeInTheDocument();
    expect(screen.getByText("Over 1,000: $0.05/unit")).toBeInTheDocument();
  });

  it("renders a hard cap's inline price after the cap line", () => {
    const quota: Quota = {
      key: "api-calls",
      name: "API Calls",
      limit: 500,
      period: "month",
      isHardCap: true,
      unitPrice: "$10 + $0.05/unit",
    };
    render(<QuotaItem quota={quota} />);
    expect(screen.getByText("API Calls:")).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
    expect(screen.getByText(/\$10 \+ \$0\.05\/unit/)).toBeInTheDocument();
  });
});
