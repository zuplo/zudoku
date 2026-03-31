import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "zudoku/router";
import {
  MonetizationContext,
  type MonetizationConfig,
} from "../MonetizationContext.js";
import type { Plan } from "../types/PlanType.js";
import CheckoutConfirmPage from "./CheckoutConfirmPage.js";

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
          price: { type: "flat", amount: "49" },
        },
      ],
    },
  ],
  monthlyPrice: "49",
  yearlyPrice: "49",
  currency: "USD",
  ...overrides,
});

const renderPage = (initialPath: string, config: MonetizationConfig = {}) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <MonetizationContext value={config}>
        <CheckoutConfirmPage />
      </MonetizationContext>
    </MemoryRouter>,
  );

describe("CheckoutConfirmPage", () => {
  beforeEach(() => {
    testState.purchaseData.data = {
      ...makePlan(),
      tax: { amount: 0 },
    };
    testState.mutation.mutate = vi.fn();
    testState.mutation.isPending = false;
    testState.mutation.isError = false;
    testState.mutation.error = null;
  });

  it("renders plan details from a flat purchase-details response", () => {
    testState.purchaseData.data = {
      ...makePlan({ name: "Starter", description: "For teams" }),
    };

    renderPage("/?planId=plan-1");

    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("For teams")).toBeInTheDocument();
  });

  it("renders plan details from a wrapped { plan, tax } response", () => {
    testState.purchaseData.data = {
      plan: makePlan({ name: "Business", description: "Scale up" }),
      tax: { amount: 1 },
    };

    renderPage("/?planId=plan-1");

    expect(screen.getByText("Business")).toBeInTheDocument();
    expect(screen.getByText("Scale up")).toBeInTheDocument();
  });

  it("shows VAT line when tax amount is a number and plan is paid", () => {
    testState.purchaseData.data = {
      ...makePlan(),
      tax: { amount: 12.5 },
    };

    renderPage("/?planId=plan-1");

    expect(screen.getByText(/\$12\.50/)).toBeInTheDocument();
    expect(screen.getByText(/VAT/)).toBeInTheDocument();
  });

  it("parses string tax amount for VAT line", () => {
    testState.purchaseData.data = {
      ...makePlan(),
      tax: { amount: "3.25" },
    };

    renderPage("/?planId=plan-1");

    expect(screen.getByText(/\$3\.25/)).toBeInTheDocument();
  });

  it("does not show VAT line when tax is missing", () => {
    testState.purchaseData.data = { ...makePlan() };

    renderPage("/?planId=plan-1");

    expect(screen.queryByText(/VAT/)).not.toBeInTheDocument();
  });

  it("does not show VAT line when tax amount is not a finite number", () => {
    testState.purchaseData.data = {
      ...makePlan(),
      tax: { amount: "not-a-number" },
    };

    renderPage("/?planId=plan-1");

    expect(screen.queryByText(/VAT/)).not.toBeInTheDocument();
  });

  it("shows Free for a zero-priced plan and omits VAT line", () => {
    testState.purchaseData.data = {
      ...makePlan({
        name: "Free",
        monthlyPrice: "0",
        yearlyPrice: "0",
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
                price: { type: "flat", amount: "0" },
              },
            ],
          },
        ],
      }),
      tax: { amount: 5 },
    };

    renderPage("/?planId=plan-1");

    expect(screen.getAllByText("Free").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/VAT/)).not.toBeInTheDocument();
  });

  it("throws when planId search param is missing", () => {
    expect(() => renderPage("/")).toThrow("Parameter `planId` missing");
  });

  it("shows mutation error in an alert", () => {
    testState.mutation.isError = true;
    testState.mutation.error = new Error("Card declined");

    renderPage("/?planId=plan-1");

    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Card declined")).toBeInTheDocument();
  });

  it("disables confirm when selected plan is missing", () => {
    testState.purchaseData.data = { plan: undefined } as unknown;

    renderPage("/?planId=plan-1");

    expect(
      screen.getByRole("button", { name: /Confirm & Subscribe/ }),
    ).toBeDisabled();
  });
});
