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
      tax: {
        currency: "usd",
        subtotal: 4900,
        taxAmount: 0,
        total: 4900,
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

  it("renders plan details from a flat purchase-details response", () => {
    testState.purchaseData.data = {
      ...makePlan({ name: "Starter", description: "For teams" }),
    };

    renderPage("/?planId=plan-1");

    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("For teams")).toBeInTheDocument();
  });

  it("shows VAT line when taxType is vat and plan is paid", () => {
    testState.purchaseData.data = {
      ...makePlan(),
      tax: {
        currency: "gbp",
        subtotal: 4900,
        taxAmount: 1250,
        total: 4912.5,
        taxInclusive: false,
        taxes: [{ taxType: "VAT" }],
        items: [{ amount: 4900, taxAmount: 1250 }],
      },
    };

    renderPage("/?planId=plan-1");

    expect(screen.getByText(/\$12\.50/)).toBeInTheDocument();
    expect(screen.getByText(/VAT/)).toBeInTheDocument();
  });

  it("shows generic tax label when tax type is not vat", () => {
    testState.purchaseData.data = {
      ...makePlan(),
      tax: {
        currency: "usd",
        subtotal: 4900,
        taxAmount: 325,
        total: 4903.25,
        taxInclusive: false,
        taxes: [{ taxType: "sales_tax" }],
        items: [{ amount: 4900, taxAmount: 325 }],
      },
    };

    renderPage("/?planId=plan-1");

    expect(screen.getByText(/\+ \$3\.25 tax/)).toBeInTheDocument();
  });

  it("shows included tax label when taxInclusive is true", () => {
    testState.purchaseData.data = {
      ...makePlan(),
      tax: {
        currency: "usd",
        subtotal: 4900,
        taxAmount: 400,
        total: 4904,
        taxInclusive: true,
        taxes: [{ taxType: "sales_tax" }],
        items: [{ amount: 4900, taxAmount: 400 }],
      },
    };

    renderPage("/?planId=plan-1");

    expect(screen.getByText(/tax included/)).toBeInTheDocument();
  });

  it("does not show tax line when tax is missing", () => {
    testState.purchaseData.data = { ...makePlan() };

    renderPage("/?planId=plan-1");

    expect(screen.queryByText(/tax|VAT/)).not.toBeInTheDocument();
  });

  it("does not show tax line when tax amount is not a finite number", () => {
    testState.purchaseData.data = {
      ...makePlan(),
      tax: {
        currency: "usd",
        subtotal: 4900,
        taxAmount: Number.NaN,
        total: 4900,
        taxInclusive: false,
        taxes: [],
        items: [{ amount: 4900, taxAmount: Number.NaN }],
      },
    };

    renderPage("/?planId=plan-1");

    expect(screen.queryByText(/tax|VAT/)).not.toBeInTheDocument();
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
      tax: {
        currency: "usd",
        subtotal: 0,
        taxAmount: 5,
        total: 5,
        taxInclusive: false,
        taxes: [{ taxType: "sales_tax" }],
        items: [],
      },
    };

    renderPage("/?planId=plan-1");

    expect(screen.getAllByText("Free").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/tax|VAT/)).not.toBeInTheDocument();
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

  it("disables confirm while mutation is pending", () => {
    testState.mutation.isPending = true;

    renderPage("/?planId=plan-1");

    expect(
      screen.getByRole("button", { name: /Processing Payment.../ }),
    ).toBeDisabled();
  });
});
