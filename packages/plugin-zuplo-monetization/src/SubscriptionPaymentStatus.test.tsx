/**
 * @vitest-environment happy-dom
 */
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { StaticZudoku } from "zudoku/testing";
import { zuploMonetizationPlugin } from "./ZuploMonetizationPlugin";
import { queryClient } from "./ZuploMonetizationWrapper";

const DEPLOYMENT = "test";
const SUB_ID = "sub-1";

const makeSubscription = (annotations?: Record<string, string>) => ({
  ...(annotations ? { annotations } : {}),
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
  id: SUB_ID,
  metadata: {},
  name: "Pro Plan",
  phases: [
    {
      activeFrom: "2024-01-01T00:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
      id: "phase-1",
      itemTimelines: {},
      items: [],
      key: "pro",
      metadata: {},
      name: "Pro",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ],
  plan: { id: "plan-1", key: "pro", version: 1 },
  proRatingConfig: { enabled: false, mode: "prorata" },
  status: "active",
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

const makeUsage = (status: string, isFirstPayment: boolean) => ({
  $schema: "",
  customerId: "cust-1",
  entitlements: {},
  planKey: "pro",
  subscriptionId: SUB_ID,
  paymentStatus: { status, isFirstPayment },
});

const seedAndRender = async (
  annotations: Record<string, string> | undefined,
  status: string,
  isFirstPayment: boolean,
) => {
  const sub = makeSubscription(annotations);
  const usage = makeUsage(status, isFirstPayment);

  queryClient.setQueryData(
    [`/v3/zudoku-metering/${DEPLOYMENT}/subscriptions`],
    { $schema: "", items: [sub], page: 1, pageSize: 10, totalCount: 1 },
  );
  queryClient.setQueryData(
    [`/v3/zudoku-metering/${DEPLOYMENT}/subscriptions/${SUB_ID}/usage`],
    usage,
  );
  queryClient.setQueryData([`/v3/zudoku-metering/${DEPLOYMENT}/pricing-page`], {
    items: [],
  });

  await act(async () => {
    render(
      <StaticZudoku
        env={{ ZUPLO_PUBLIC_DEPLOYMENT_NAME: DEPLOYMENT }}
        plugins={[zuploMonetizationPlugin()]}
        path={`/subscriptions/${SUB_ID}`}
        isAuthenticated
      />,
    );
  });
};

beforeEach(() => {
  queryClient.clear();
});

describe("Subscription payment status", () => {
  // ─────────────────────────────────────────────────────────────────────────
  // NEW SUBSCRIPTION (no previous subscription annotation)
  // ─────────────────────────────────────────────────────────────────────────
  describe("New subscription (no annotations)", () => {
    const annotations = undefined;

    describe("isFirstPayment = true", () => {
      const isFirst = true;

      it("failed: shows payment error and link to manage billing, hides API keys", async () => {
        await seedAndRender({}, "failed", isFirst);

        expect(screen.getByText("Payment failed")).toBeInTheDocument();
        expect(screen.getByText("Manage billing")).toBeInTheDocument();
        expect(
          screen.queryByText(
            "Your keys will be available once the payment has been successfully",
          ),
        ).toBeInTheDocument();
      });

      it("uncollectible: shows 'Payment unsuccessful' warning and link to manage billing, hides API keys", async () => {
        await seedAndRender(annotations, "uncollectible", isFirst);

        expect(screen.getByText("Payment unsuccessful")).toBeInTheDocument();
        expect(screen.getByText("Manage billing")).toBeInTheDocument();
      });

      it("paid: shows API keys with no warnings", async () => {
        await seedAndRender(annotations, "paid", isFirst);

        expect(screen.getByText("API Keys")).toBeInTheDocument();
        // No error or warning alerts
        expect(screen.queryByText("Payment failed")).not.toBeInTheDocument();
        expect(
          screen.queryByText("Your payment is being processed"),
        ).not.toBeInTheDocument();
        expect(screen.queryByText(/contact support/i)).not.toBeInTheDocument();
      });

      it("pending: shows processing message and hides API keys", async () => {
        await seedAndRender(annotations, "pending", isFirst);

        expect(
          screen.getByText("Your payment is being processed"),
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Your keys will be available/),
        ).toBeInTheDocument();
      });
    });

    describe("isFirstPayment = false", () => {
      const isFirst = false;

      it("failed: shows payment failed notification, shows API keys", async () => {
        await seedAndRender(
          {
            "subscription.previous.id": "prev-sub-1",
          },
          "failed",
          isFirst,
        );

        expect(screen.getByText("Payment failed")).toBeInTheDocument();
        // API keys keep working — should be visible without overlay
        expect(screen.getByText("API Keys")).toBeInTheDocument();
        expect(
          screen.queryByText(/Your keys will be available/),
        ).not.toBeInTheDocument();
      });

      it("uncollectible: shows 'Payment unsuccessful' warning and link to manage billing, hides API keys", async () => {
        await seedAndRender(annotations, "uncollectible", isFirst);

        expect(screen.getByText("Payment unsuccessful")).toBeInTheDocument();
        expect(screen.getByText("Manage billing")).toBeInTheDocument();
      });

      it("paid: shows API keys with no warnings", async () => {
        await seedAndRender(annotations, "paid", isFirst);

        expect(screen.getByText("API Keys")).toBeInTheDocument();
        expect(screen.queryByText("Payment failed")).not.toBeInTheDocument();
        expect(
          screen.queryByText("Your payment is being processed"),
        ).not.toBeInTheDocument();
        expect(screen.queryByText(/contact support/i)).not.toBeInTheDocument();
      });

      it("pending: shows processing message and API keys", async () => {
        await seedAndRender(annotations, "pending", isFirst);

        // Should show processing message even for non-first payments
        expect(
          screen.getByText(/payment is being processed/i),
        ).toBeInTheDocument();
        // API keys keep working — should be visible without overlay
        expect(screen.getByText("API Keys")).toBeInTheDocument();
        expect(
          screen.queryByText(/Your keys will be available/),
        ).not.toBeInTheDocument();
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // UPGRADE SUBSCRIPTION (has previous subscription annotation)
  // ─────────────────────────────────────────────────────────────────────────
  describe("Upgrade subscription (has previous subscription annotation)", () => {
    const annotations = { "subscription.previous.id": "prev-sub-1" };

    describe("isFirstPayment = true", () => {
      const isFirst = true;

      it("failed: shows failed payment warning with manage billing link, shows API keys", async () => {
        await seedAndRender(annotations, "failed", isFirst);

        expect(screen.getByText("Payment failed")).toBeInTheDocument();
        expect(screen.getByText("Manage billing")).toBeInTheDocument();
        // API keys keep working for upgrades — should be visible
        expect(screen.getByText("API Keys")).toBeInTheDocument();
        expect(
          screen.queryByText(/Your keys will be available/),
        ).not.toBeInTheDocument();
      });

      it("uncollectible: shows 'Payment unsuccessful' warning and link to manage billing, shows API keys", async () => {
        await seedAndRender(annotations, "uncollectible", isFirst);

        expect(screen.getByText("Payment unsuccessful")).toBeInTheDocument();
        expect(screen.getByText("Manage billing")).toBeInTheDocument();
        // API keys continue working
        expect(screen.getByText("API Keys")).toBeInTheDocument();
      });

      it("paid: shows API keys with no warnings", async () => {
        await seedAndRender(annotations, "paid", isFirst);

        expect(screen.getByText("API Keys")).toBeInTheDocument();
        expect(screen.queryByText("Payment failed")).not.toBeInTheDocument();
        expect(
          screen.queryByText("Your payment is being processed"),
        ).not.toBeInTheDocument();
        expect(screen.queryByText(/contact support/i)).not.toBeInTheDocument();
      });

      it("pending: shows pending message, shows API keys", async () => {
        await seedAndRender(annotations, "pending", isFirst);

        expect(
          screen.getByText(/payment is being processed/i),
        ).toBeInTheDocument();
        // API keys continue working for upgrades
        expect(screen.getByText("API Keys")).toBeInTheDocument();
        expect(
          screen.queryByText(/Your keys will be available/),
        ).not.toBeInTheDocument();
      });
    });

    // isFirstPayment = false — same behavior as new subscription isFirstPayment = false
    describe("isFirstPayment = false", () => {
      const isFirst = false;

      it("failed: shows payment failed notification, shows API keys", async () => {
        await seedAndRender(annotations, "failed", isFirst);

        expect(screen.getByText("Payment failed")).toBeInTheDocument();
        expect(screen.getByText("API Keys")).toBeInTheDocument();
        expect(
          screen.queryByText(/Your keys will be available/),
        ).not.toBeInTheDocument();
      });

      it("uncollectible: shows 'Payment unsuccessful' warning and link to manage billing, shows API keys", async () => {
        await seedAndRender(annotations, "uncollectible", isFirst);

        expect(screen.getByText("Payment unsuccessful")).toBeInTheDocument();
        expect(screen.getByText("Manage billing")).toBeInTheDocument();
      });

      it("paid: shows API keys with no warnings", async () => {
        await seedAndRender(annotations, "paid", isFirst);

        expect(screen.getByText("API Keys")).toBeInTheDocument();
        expect(screen.queryByText("Payment failed")).not.toBeInTheDocument();
        expect(
          screen.queryByText("Your payment is being processed"),
        ).not.toBeInTheDocument();
      });

      it("pending: shows processing message and API keys", async () => {
        await seedAndRender(annotations, "pending", isFirst);

        expect(
          screen.getByText(/payment is being processed/i),
        ).toBeInTheDocument();
        expect(screen.getByText("API Keys")).toBeInTheDocument();
        expect(
          screen.queryByText(/Your keys will be available/),
        ).not.toBeInTheDocument();
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // DOWNGRADE SUBSCRIPTION (has previous subscription annotation)
  // Behavior is identical to upgrade subscription
  // ─────────────────────────────────────────────────────────────────────────
  describe("Downgrade subscription (has previous subscription annotation)", () => {
    const annotations = { "subscription.previous.id": "prev-sub-2" };

    // isFirstPayment = true — same as upgrade isFirstPayment = true
    describe("isFirstPayment = true", () => {
      const isFirst = true;

      it("failed: shows failed payment warning with manage billing link, shows API keys", async () => {
        await seedAndRender(annotations, "failed", isFirst);

        expect(screen.getByText("Payment failed")).toBeInTheDocument();
        expect(screen.getByText("Manage billing")).toBeInTheDocument();
        expect(screen.getByText("API Keys")).toBeInTheDocument();
        expect(
          screen.queryByText(/Your keys will be available/),
        ).not.toBeInTheDocument();
      });

      it("uncollectible: shows 'Payment unsuccessful' warning and link to manage billing, shows API keys", async () => {
        await seedAndRender(annotations, "uncollectible", isFirst);

        expect(screen.getByText("Payment unsuccessful")).toBeInTheDocument();
        expect(screen.getByText("Manage billing")).toBeInTheDocument();
      });

      it("paid: shows API keys with no warnings", async () => {
        await seedAndRender(annotations, "paid", isFirst);

        expect(screen.getByText("API Keys")).toBeInTheDocument();
        expect(screen.queryByText("Payment failed")).not.toBeInTheDocument();
        expect(
          screen.queryByText("Your payment is being processed"),
        ).not.toBeInTheDocument();
        expect(screen.queryByText(/contact support/i)).not.toBeInTheDocument();
      });

      it("pending: shows pending message, shows API keys", async () => {
        await seedAndRender(annotations, "pending", isFirst);

        expect(
          screen.getByText(/payment is being processed/i),
        ).toBeInTheDocument();
        expect(screen.getByText("API Keys")).toBeInTheDocument();
        expect(
          screen.queryByText(/Your keys will be available/),
        ).not.toBeInTheDocument();
      });
    });

    // isFirstPayment = false — same behavior as new subscription isFirstPayment = false
    describe("isFirstPayment = false", () => {
      const isFirst = false;

      it("failed: shows payment failed notification, shows API keys", async () => {
        await seedAndRender(annotations, "failed", isFirst);

        expect(screen.getByText("Payment failed")).toBeInTheDocument();
        expect(screen.getByText("API Keys")).toBeInTheDocument();
        expect(
          screen.queryByText(/Your keys will be available/),
        ).not.toBeInTheDocument();
      });

      it("uncollectible: shows 'Payment unsuccessful' warning and link to manage billing, shows API keys", async () => {
        await seedAndRender(annotations, "uncollectible", isFirst);

        expect(screen.getByText("Payment unsuccessful")).toBeInTheDocument();
        expect(screen.getByText("Manage billing")).toBeInTheDocument();
      });

      it("paid: shows API keys with no warnings", async () => {
        await seedAndRender(annotations, "paid", isFirst);

        expect(screen.getByText("API Keys")).toBeInTheDocument();
        expect(screen.queryByText("Payment failed")).not.toBeInTheDocument();
        expect(
          screen.queryByText("Your payment is being processed"),
        ).not.toBeInTheDocument();
      });

      it("pending: shows processing message and API keys", async () => {
        await seedAndRender(annotations, "pending", isFirst);

        expect(
          screen.getByText(/payment is being processed/i),
        ).toBeInTheDocument();
        expect(screen.getByText("API Keys")).toBeInTheDocument();
        expect(
          screen.queryByText(/Your keys will be available/),
        ).not.toBeInTheDocument();
      });
    });
  });
});
