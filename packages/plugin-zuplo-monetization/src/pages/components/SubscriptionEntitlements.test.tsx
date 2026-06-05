import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SubscriptionPlanView } from "../../utils/subscriptionEntitlements.js";
import { SubscriptionEntitlements } from "./SubscriptionEntitlements.js";

const baseView: SubscriptionPlanView = {
  priceLabel: { type: "free" },
  entitlements: { quotas: [], features: [], items: [] },
  fallbackPhases: [],
  usingItems: true,
};

describe("SubscriptionEntitlements", () => {
  it("renders provisioned quotas and features when using items", () => {
    render(
      <SubscriptionEntitlements
        view={{
          ...baseView,
          usingItems: true,
          entitlements: {
            quotas: [
              { key: "api", name: "API Calls", limit: 1000, period: "month" },
            ],
            features: [{ key: "sso", name: "SSO" }],
            items: [
              {
                kind: "quota",
                key: "api",
                name: "API Calls",
                limit: 1000,
                period: "month",
              },
              { kind: "feature", key: "sso", name: "SSO" },
            ],
          },
        }}
      />,
    );

    expect(screen.getByText("API Calls:")).toBeInTheDocument();
    expect(screen.getByText(/1,000/)).toBeInTheDocument();
    expect(screen.getByText("SSO")).toBeInTheDocument();
  });

  it("renders nothing when using items but there are none", () => {
    const { container } = render(
      <SubscriptionEntitlements view={{ ...baseView, usingItems: true }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("falls back to the plan's phases when items aren't populated", () => {
    render(
      <SubscriptionEntitlements
        view={{
          ...baseView,
          usingItems: false,
          fallbackPhases: [
            {
              key: "default",
              name: "Default",
              rateCards: [
                {
                  type: "usage_based",
                  key: "api_requests",
                  name: "API Requests",
                  featureKey: "api_requests",
                  billingCadence: "P1M",
                  price: null,
                  entitlementTemplate: {
                    type: "metered",
                    issueAfterReset: 500,
                    usagePeriod: "P1M",
                  },
                },
              ],
            },
          ],
        }}
        currency="USD"
        billingCadence="P1M"
      />,
    );

    expect(screen.getByText("API Requests:")).toBeInTheDocument();
    expect(screen.getByText(/500 \/ month/)).toBeInTheDocument();
  });

  it("renders nothing when falling back with no phases", () => {
    const { container } = render(
      <SubscriptionEntitlements view={{ ...baseView, usingItems: false }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
