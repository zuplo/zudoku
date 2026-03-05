import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Item } from "../../hooks/useSubscriptions.js";
import type { MeteredEntitlement } from "./Usage.js";
import { Usage } from "./Usage.js";

const makeUsage = (meter: Partial<MeteredEntitlement> = {}) => ({
  $schema: "",
  customerId: "cust-1",
  entitlements: {
    requests: {
      hasAccess: true,
      balance: 500,
      usage: 500,
      overage: 0,
      ...meter,
    },
  },
  planKey: "pro",
  subscriptionId: "sub-1",
  paymentStatus: { status: "paid" as const },
});

const softLimitItem = {
  featureKey: "requests",
  name: "API Requests",
  included: { entitlement: { isSoftLimit: true } },
  price: {
    type: "tiered",
    tiers: [
      { flatPrice: { amount: "10" }, upToAmount: "1000" },
      { flatPrice: { amount: "0" }, unitPrice: { amount: "0.02" } },
    ],
  },
} as Item;

const hardLimitItem = {
  ...softLimitItem,
  included: {
    ...softLimitItem.included,
    entitlement: { isSoftLimit: false },
  },
} as Item;

describe("Usage - UsageItem", () => {
  it("shows overage alert for soft limit with overage", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 1200, overage: 200 })}
        isFetching={false}
        currentItems={[softLimitItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.getByText("You've exceeded your monthly quota"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("You've reached your monthly limit"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/\+200 overage/)).toBeInTheDocument();
    expect(screen.getByText(/\$0\.02\/call/)).toBeInTheDocument();
  });

  it("shows hard limit alert when at limit", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 1000, overage: 0 })}
        isFetching={false}
        currentItems={[hardLimitItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.getByText("You've reached your monthly limit"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("You've exceeded your monthly quota"),
    ).not.toBeInTheDocument();
  });

  it("shows no alert for soft limit under quota", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 500, usage: 500, overage: 0 })}
        isFetching={false}
        currentItems={[softLimitItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.queryByText("You've exceeded your monthly quota"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("You've reached your monthly limit"),
    ).not.toBeInTheDocument();
  });

  it("shows no alert for hard limit under capacity", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 200, usage: 800, overage: 0 })}
        isFetching={false}
        currentItems={[hardLimitItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.queryByText("You've reached your monthly limit"),
    ).not.toBeInTheDocument();
  });

  it("shows hard limit alert and hides overage when hard limit has overage", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 1200, overage: 200 })}
        isFetching={false}
        currentItems={[hardLimitItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.getByText("You've reached your monthly limit"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("You've exceeded your monthly quota"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/overage/)).not.toBeInTheDocument();
  });

  it("renders without error when limit is zero", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 0, overage: 0 })}
        isFetching={false}
        currentItems={[softLimitItem]}
        isPendingFirstPayment={false}
      />,
    );
    expect(screen.getByText(/0 used/)).toBeInTheDocument();
  });

  it("defaults to soft limit when item is missing", () => {
    render(
      <Usage
        usage={makeUsage({ balance: 0, usage: 1200, overage: 200 })}
        isFetching={false}
        currentItems={[]}
        isPendingFirstPayment={false}
      />,
    );
    expect(
      screen.getByText("You've exceeded your monthly quota"),
    ).toBeInTheDocument();
  });
});
