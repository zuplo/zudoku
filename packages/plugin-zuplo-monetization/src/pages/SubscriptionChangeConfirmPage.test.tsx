import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "zudoku/router";
import {
  MonetizationContext,
  type MonetizationConfig,
} from "../MonetizationContext.js";
import type { Plan } from "../types/PlanType.js";
import SubscriptionChangeConfirmPage from "./SubscriptionChangeConfirmPage.js";

vi.mock("zudoku/hooks", () => ({
  useZudoku: () => ({ env: { ZUPLO_PUBLIC_DEPLOYMENT_NAME: "test-env" } }),
}));

vi.mock("../hooks/useDeploymentName", () => ({
  useDeploymentName: () => "test-deployment",
}));

const testState = vi.hoisted(() => ({
  purchaseData: {
    data: null as unknown,
  },
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
  monthlyPrice: "45",
  yearlyPrice: "540",
  currency: "USD",
  ...overrides,
});

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
    testState.mutation.mutate = vi.fn();
    testState.mutation.isPending = false;
    testState.mutation.isError = false;
    testState.mutation.error = null;
  });

  it("shows immediate effective message by default", () => {
    renderPage("/?planId=plan-1&subscriptionId=sub-1");

    expect(
      screen.getByText("This change will take effect immediately."),
    ).toBeInTheDocument();
  });

  it("shows next billing cycle message for downgrade mode", () => {
    renderPage("/?planId=plan-1&subscriptionId=sub-1&mode=downgrade");

    expect(
      screen.getByText(
        "This change will take effect at the start of your next billing cycle.",
      ),
    ).toBeInTheDocument();
  });

  it("shows VAT tax line when taxType is vat and tax is exclusive", () => {
    testState.purchaseData.data = {
      ...makePlan(),
      tax: {
        currency: "gbp",
        subtotal: 4500,
        taxAmount: 9,
        total: 4509,
        taxInclusive: false,
        taxes: [{ taxType: "VAT" }],
        items: [],
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
        taxAmount: 5,
        total: 4505,
        taxInclusive: true,
        taxes: [{ taxType: "sales_tax" }],
        items: [],
      },
    };

    renderPage("/?planId=plan-1&subscriptionId=sub-1");

    expect(screen.getByText(/tax included/)).toBeInTheDocument();
  });

  it("does not show tax line when taxAmount is missing", () => {
    testState.purchaseData.data = { ...makePlan() };

    renderPage("/?planId=plan-1&subscriptionId=sub-1");

    expect(screen.queryByText(/tax|VAT/)).not.toBeInTheDocument();
  });

  it("throws when required search params are missing", () => {
    expect(() => renderPage("/?planId=plan-1")).toThrow(
      "Parameter `subscriptionId` missing",
    );
  });
});
