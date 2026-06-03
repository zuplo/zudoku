import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "zudoku/router";
import {
  MonetizationContext,
  type MonetizationConfig,
} from "../MonetizationContext.js";
import type { Plan } from "../types/PlanType.js";
import type { Subscription } from "../types/SubscriptionType.js";
import SubscriptionChangeConfirmPage from "./SubscriptionChangeConfirmPage.js";

vi.mock("zudoku/hooks", () => ({
  useZudoku: () => ({ env: { ZUPLO_PUBLIC_DEPLOYMENT_NAME: "test-env" } }),
}));

vi.mock("../hooks/useDeploymentName", () => ({
  useDeploymentName: () => "test-deployment",
}));

const testState = vi.hoisted(() => ({
  purchaseData: { data: null as unknown },
  subscriptions: { items: [] as unknown[] },
  creditEstimate: undefined as unknown,
  mutation: {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null as Error | null,
  },
}));

vi.mock("zudoku/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("zudoku/react-query")>();
  return {
    ...actual,
    useSuspenseQuery: () => ({ data: testState.purchaseData.data }),
    useMutation: () => testState.mutation,
    useQuery: (options: { queryKey?: unknown[] }) => {
      const key = Array.isArray(options?.queryKey)
        ? String(options.queryKey[0])
        : "";
      if (key.includes("estimate-credit")) {
        return { data: testState.creditEstimate };
      }
      if (key.includes("/subscriptions")) {
        return { data: testState.subscriptions };
      }
      return { data: undefined };
    },
  };
});

const makePlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: "plan-1",
  key: "pro",
  name: "Pro",
  billingCadence: "P1M",
  phases: [
    {
      key: "default",
      name: "Default",
      rateCards: [
        {
          type: "flat_fee",
          key: "base-fee",
          name: "Base Fee",
          billingCadence: "P1M",
          price: { type: "flat", amount: "45" },
        },
      ],
    },
  ],
  currency: "USD",
  ...overrides,
});

const currentSubscription = (): Subscription =>
  ({
    id: "sub-1",
    currency: "USD",
    activeFrom: "2026-05-01T12:00:00.000Z",
    alignment: {
      billablesMustAlign: true,
      currentAlignedBillingPeriod: {
        from: "2026-06-01T12:00:00.000Z",
        to: "2026-07-01T12:00:00.000Z",
      },
    },
    billingCadence: "P1M",
    name: "Current Plan Name",
    plan: {
      id: "cur",
      key: "current",
      name: "Current Plan Name",
      billingCadence: "P1M",
      currency: "USD",
      phases: [],
    },
    phases: [
      {
        activeFrom: "2026-05-01T12:00:00.000Z",
        createdAt: "2026-05-01T12:00:00.000Z",
        id: "phase-1",
        itemTimelines: {},
        items: [
          {
            activeFrom: "2026-05-01T12:00:00.000Z",
            billingCadence: "P1M",
            createdAt: "2026-05-01T12:00:00.000Z",
            featureKey: "api_requests",
            id: "item-1",
            included: {
              entitlement: {
                activeFrom: "2026-05-01T12:00:00.000Z",
                annotations: { "subscription.id": "sub-1" },
                createdAt: "2026-05-01T12:00:00.000Z",
                featureId: "f",
                featureKey: "api_requests",
                id: "ent-1",
                issueAfterReset: 1000,
                subjectKey: "s",
                type: "metered",
                updatedAt: "2026-05-01T12:00:00.000Z",
                usagePeriod: {
                  anchor: "x",
                  interval: "P1M",
                  intervalISO: "P1M",
                },
              },
              feature: {
                createdAt: "x",
                id: "f",
                key: "api_requests",
                name: "Current Calls",
                updatedAt: "x",
              },
            },
            key: "api_requests",
            metadata: {},
            name: "Current Calls",
            updatedAt: "2026-05-01T12:00:00.000Z",
          },
        ],
        key: "default",
        metadata: {},
        name: "Default",
        updatedAt: "2026-05-01T12:00:00.000Z",
      },
    ],
  }) as unknown as Subscription;

const renderPage = (initialPath: string, config: MonetizationConfig = {}) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <MonetizationContext value={config}>
        <SubscriptionChangeConfirmPage />
      </MonetizationContext>
    </MemoryRouter>,
  );

describe("SubscriptionChangeConfirmPage", () => {
  beforeEach(() => {
    testState.purchaseData.data = {
      ...makePlan(),
      tax: {
        currency: "usd",
        subtotal: 4500,
        taxAmount: 0,
        total: 4500,
        taxInclusive: false,
        taxes: [],
        items: [],
      },
    };
    testState.subscriptions = { items: [currentSubscription()] };
    testState.creditEstimate = undefined;
    testState.mutation.mutate = vi.fn();
    testState.mutation.isPending = false;
    testState.mutation.isError = false;
    testState.mutation.error = null;
  });

  it("shows the current plan and the target plan side by side", () => {
    renderPage("/?planId=plan-1&subscriptionId=sub-1");

    expect(screen.getByText("Current Plan")).toBeInTheDocument();
    expect(screen.getByText("Current Plan Name")).toBeInTheDocument();
    expect(screen.getByText("Changing to")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("takes effect immediately by default (upgrade)", () => {
    renderPage("/?planId=plan-1&subscriptionId=sub-1");
    expect(screen.getByText("Takes effect immediately")).toBeInTheDocument();
  });

  it("shows a concrete next-billing-cycle date for a downgrade", () => {
    renderPage("/?planId=plan-1&subscriptionId=sub-1&mode=downgrade");

    const note = screen.getByText(
      /Takes effect .*at the start of your next billing cycle/,
    );
    expect(note).toBeInTheDocument();
    // The concrete date includes a time of day.
    expect(note.textContent).toMatch(/\d{1,2}:\d{2}/);
  });

  it("shows the proration credit when the estimate returns one", () => {
    testState.creditEstimate = { creditAmount: "5", currency: "USD" };

    renderPage("/?planId=plan-1&subscriptionId=sub-1");

    expect(
      screen.getByText(/You'll be credited \$5 for unused time/),
    ).toBeInTheDocument();
  });

  it("omits the proration credit line when there is no estimate", () => {
    renderPage("/?planId=plan-1&subscriptionId=sub-1");

    expect(screen.queryByText(/You'll be credited/)).not.toBeInTheDocument();
  });

  it("shows VAT tax line when taxType is vat and tax is exclusive", () => {
    testState.purchaseData.data = {
      ...makePlan(),
      tax: {
        currency: "gbp",
        subtotal: 4500,
        taxAmount: 900,
        total: 5400,
        taxInclusive: false,
        taxes: [{ taxType: "VAT" }],
        items: [{ amount: 4500, taxAmount: 900 }],
      },
    };

    renderPage("/?planId=plan-1&subscriptionId=sub-1");

    expect(screen.getByText(/\+ .* VAT/)).toBeInTheDocument();
  });

  it("shows included tax line when taxInclusive is true", () => {
    testState.purchaseData.data = {
      ...makePlan(),
      tax: {
        currency: "usd",
        subtotal: 4500,
        taxAmount: 500,
        total: 4500,
        taxInclusive: true,
        taxes: [{ taxType: "sales_tax" }],
        items: [{ amount: 4500, taxAmount: 500 }],
      },
    };

    renderPage("/?planId=plan-1&subscriptionId=sub-1");

    expect(screen.getByText(/tax included/)).toBeInTheDocument();
  });

  it("does not show a tax line when taxAmount is missing", () => {
    testState.purchaseData.data = { ...makePlan() };

    renderPage("/?planId=plan-1&subscriptionId=sub-1");

    expect(
      screen.queryByText(/\bVAT\b|tax included|tax$/),
    ).not.toBeInTheDocument();
  });

  it("throws when required search params are missing", () => {
    expect(() => renderPage("/?planId=plan-1")).toThrow(
      "Parameter `subscriptionId` missing",
    );
  });
});
