/**
 * @vitest-environment happy-dom
 */
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { StaticZudoku } from "zudoku/testing";
import { zuploMonetizationPlugin } from "./ZuploMonetizationPlugin";
import { queryClient } from "./ZuploMonetizationWrapper";

const DEPLOYMENT = "test";

const makeSubscription = (
  id: string,
  name: string,
  status: string,
  planKey: string,
) => ({
  activeFrom: "2024-01-01T00:00:00Z",
  alignment: {
    billablesMustAlign: false,
    currentAlignedBillingPeriod: {
      from: "2024-01-01T00:00:00Z",
      to: "2024-02-01T00:00:00Z",
    },
  },
  billingAnchor: "2024-01-01T00:00:00Z",
  billingCadence: "P1M",
  createdAt: "2024-01-01T00:00:00Z",
  currency: "USD",
  customerId: "cust-1",
  id,
  metadata: {},
  name,
  phases: [
    {
      activeFrom: "2024-01-01T00:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
      id: `phase-${id}`,
      itemTimelines: {},
      items: [
        {
          featureKey: "requests",
          name: "API Requests",
          included: {
            entitlement: { isSoftLimit: true },
            feature: {
              createdAt: "2024-01-01T00:00:00Z",
              id: "feat-1",
              key: "requests",
              name: "API Requests",
              updatedAt: "2024-01-01T00:00:00Z",
            },
          },
          activeFrom: "2024-01-01T00:00:00Z",
          billingCadence: "P1M",
          createdAt: "2024-01-01T00:00:00Z",
          id: `item-${id}`,
          key: "requests",
          metadata: {},
          price: {
            type: "tiered",
            tiers: [{ flatPrice: { amount: "0", type: "flat" } }],
          },
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ],
      key: planKey,
      metadata: {},
      name,
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ],
  plan: { id: `plan-${id}`, key: planKey, version: 1 },
  proRatingConfig: { enabled: false, mode: "prorata" },
  status,
  updatedAt: "2024-01-01T00:00:00Z",
  consumer: {
    id: "consumer-1",
    name: "Test Consumer",
    createdOn: "2024-01-01T00:00:00Z",
    updatedOn: "2024-01-01T00:00:00Z",
    tags: {},
    metadata: {},
    apiKeys: [
      {
        id: "key-1",
        createdOn: "2024-01-01T00:00:00Z",
        updatedOn: "2024-01-01T00:00:00Z",
        key: "zpka_test_key_1234567890",
      },
    ],
    managers: [],
  },
});

const makeUsage = (subId: string) => ({
  $schema: "",
  customerId: "cust-1",
  entitlements: {
    requests: {
      hasAccess: true,
      balance: 500,
      usage: 100,
      overage: 0,
    },
  },
  planKey: "pro",
  subscriptionId: subId,
  paymentStatus: { status: "paid", isFirstPayment: false },
});

beforeEach(() => {
  queryClient.clear();
});

describe("Subscription selection", () => {
  it("selects active subscription when a scheduled subscription appears first in API response", async () => {
    const scheduled = makeSubscription(
      "sub-scheduled",
      "Business Plan",
      "scheduled",
      "business",
    );
    const active = makeSubscription("sub-active", "Pro Plan", "active", "pro");

    // API returns scheduled first, active second
    queryClient.setQueryData(
      [`/v3/zudoku-metering/${DEPLOYMENT}/subscriptions`],
      {
        $schema: "",
        items: [scheduled, active],
        page: 1,
        pageSize: 10,
        totalCount: 2,
      },
    );
    queryClient.setQueryData(
      [`/v3/zudoku-metering/${DEPLOYMENT}/subscriptions/sub-active/usage`],
      makeUsage("sub-active"),
    );
    queryClient.setQueryData(
      [`/v3/zudoku-metering/${DEPLOYMENT}/pricing-page`],
      { items: [] },
    );

    await act(async () => {
      render(
        <StaticZudoku
          env={{ ZUPLO_PUBLIC_DEPLOYMENT_NAME: DEPLOYMENT }}
          plugins={[zuploMonetizationPlugin()]}
          path="/subscriptions"
          isAuthenticated
        />,
      );
    });

    // The active subscription's usage should be rendered, not the scheduled one's
    expect(screen.getByText("API Requests")).toBeInTheDocument();
    // The active sub's name should be highlighted/selected in the list
    expect(screen.getByText("Pro Plan")).toBeInTheDocument();
    expect(screen.getByText("Business Plan")).toBeInTheDocument();
  });

  it("shows feature key as usage title when item is not matched", async () => {
    const sub = makeSubscription("sub-1", "Pro Plan", "active", "pro");
    // Remove items from the phase so the feature key lookup won't match
    sub.phases[0].items = [];

    queryClient.setQueryData(
      [`/v3/zudoku-metering/${DEPLOYMENT}/subscriptions`],
      {
        $schema: "",
        items: [sub],
        page: 1,
        pageSize: 10,
        totalCount: 1,
      },
    );
    queryClient.setQueryData(
      [`/v3/zudoku-metering/${DEPLOYMENT}/subscriptions/sub-1/usage`],
      makeUsage("sub-1"),
    );
    queryClient.setQueryData(
      [`/v3/zudoku-metering/${DEPLOYMENT}/pricing-page`],
      { items: [] },
    );

    await act(async () => {
      render(
        <StaticZudoku
          env={{ ZUPLO_PUBLIC_DEPLOYMENT_NAME: DEPLOYMENT }}
          plugins={[zuploMonetizationPlugin()]}
          path="/subscriptions?subscriptionId=sub-1"
          isAuthenticated
        />,
      );
    });

    // Should show the feature key "requests" instead of "Limit"
    expect(screen.getByText("requests")).toBeInTheDocument();
    expect(screen.queryByText("Limit")).not.toBeInTheDocument();
  });
});
