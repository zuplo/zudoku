import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "zudoku/router";
import {
  type BeforeCheckoutProps,
  MonetizationContext,
  type MonetizationConfig,
} from "../MonetizationContext.js";
import type { Plan } from "../types/PlanType.js";
import CheckoutPage from "./CheckoutPage.js";

vi.mock("zudoku/hooks", () => ({
  useZudoku: () => ({
    env: { ZUPLO_PUBLIC_DEPLOYMENT_NAME: "test-env" },
    options: { basePath: undefined },
  }),
  useAuth: () => ({ profile: { sub: "user-1" } }),
}));

vi.mock("../hooks/useDeploymentName", () => ({
  useDeploymentName: () => "test-deployment",
}));

vi.mock("../hooks/useUrlUtils", () => ({
  useUrlUtils: () => ({
    generateUrl: (path: string) => `https://portal${path}`,
  }),
}));

const testState = vi.hoisted(() => ({
  /** Every `useQuery` the tree mounted — a Stripe Checkout Session per entry. */
  sessionRequests: [] as unknown[],
  plans: { items: [] as Plan[] },
}));

vi.mock("../hooks/usePlans", () => ({
  usePlans: () => ({ data: testState.plans }),
}));

vi.mock("zudoku/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("zudoku/react-query")>();
  return {
    ...actual,
    useQuery: (options: unknown) => {
      testState.sessionRequests.push(options);
      return { data: { url: "https://stripe.test/session" }, isError: false };
    },
  };
});

// The real component leaves the SPA via `window.location.href`; assert on what
// it was handed rather than letting it drive the test environment.
vi.mock("../components/RedirectPage.js", () => ({
  RedirectPage: ({ url }: { url?: string }) => (
    <div data-testid="redirect" data-url={url} />
  ),
}));

const makePlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: "plan-1",
  key: "pro",
  name: "Pro",
  billingCadence: "P1M",
  currency: "USD",
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
  ...overrides,
});

const renderPage = (initialPath: string, config: MonetizationConfig = {}) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <MonetizationContext value={config}>
        <CheckoutPage />
      </MonetizationContext>
    </MemoryRouter>,
  );

/**
 * Stands in for a developer-supplied questionnaire: submits to their own
 * endpoint and only proceeds if that succeeded.
 */
const questionnaire =
  (submitAnswers: (size: string) => Promise<unknown>) =>
  ({ plan, onComplete, onCancel }: BeforeCheckoutProps) => (
    <div>
      <span data-testid="gate-plan">{plan.name}</span>
      <button
        type="button"
        onClick={() => {
          submitAnswers("50-200").then(onComplete, () => {
            /* keep the user on the questionnaire */
          });
        }}
      >
        Continue
      </button>
      <button type="button" onClick={onCancel}>
        Back
      </button>
    </div>
  );

describe("CheckoutPage", () => {
  beforeEach(() => {
    testState.sessionRequests = [];
    testState.plans = { items: [makePlan()] };
  });

  it("redirects to pricing without a planId", () => {
    renderPage("/checkout");

    expect(screen.queryByTestId("redirect")).not.toBeInTheDocument();
    expect(testState.sessionRequests).toHaveLength(0);
  });

  it("goes straight to Stripe when no questionnaire is configured", () => {
    renderPage("/checkout?planId=plan-1");

    expect(screen.getByTestId("redirect")).toHaveAttribute(
      "data-url",
      "https://stripe.test/session",
    );
    expect(testState.sessionRequests).toHaveLength(1);
  });

  it("shows the questionnaire and creates no Stripe session until it completes", async () => {
    const submitAnswers = vi.fn(() => Promise.resolve());
    renderPage("/checkout?planId=plan-1", {
      checkout: { renderBeforeCheckout: questionnaire(submitAnswers) },
    });

    expect(screen.getByTestId("gate-plan")).toHaveTextContent("Pro");
    expect(screen.queryByTestId("redirect")).not.toBeInTheDocument();
    expect(testState.sessionRequests).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(screen.getByTestId("redirect")).toBeInTheDocument(),
    );
    expect(submitAnswers).toHaveBeenCalledWith("50-200");
    expect(testState.sessionRequests).toHaveLength(1);
  });

  it("holds checkout when the questionnaire's own submit fails", async () => {
    const submitAnswers = vi.fn(() => Promise.reject(new Error("crm down")));
    renderPage("/checkout?planId=plan-1", {
      checkout: { renderBeforeCheckout: questionnaire(submitAnswers) },
    });

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(submitAnswers).toHaveBeenCalled());
    expect(screen.getByTestId("gate-plan")).toBeInTheDocument();
    expect(screen.queryByTestId("redirect")).not.toBeInTheDocument();
    expect(testState.sessionRequests).toHaveLength(0);
  });

  it("proceeds immediately when the questionnaire returns null", () => {
    renderPage("/checkout?planId=plan-1", {
      checkout: { renderBeforeCheckout: () => null },
    });

    expect(screen.getByTestId("redirect")).toBeInTheDocument();
    expect(testState.sessionRequests).toHaveLength(1);
  });

  it("passes the chosen plan so the questionnaire can vary by plan", () => {
    testState.plans = {
      items: [
        makePlan(),
        makePlan({ id: "plan-2", key: "team", name: "Team" }),
      ],
    };
    renderPage("/checkout?planId=plan-2", {
      checkout: {
        renderBeforeCheckout: questionnaire(() => Promise.resolve()),
      },
    });

    expect(screen.getByTestId("gate-plan")).toHaveTextContent("Team");
  });

  it("skips the questionnaire for an unknown plan id", () => {
    const renderBeforeCheckout = vi.fn(() => <div>should not render</div>);
    renderPage("/checkout?planId=does-not-exist", {
      checkout: { renderBeforeCheckout },
    });

    expect(renderBeforeCheckout).not.toHaveBeenCalled();
    expect(screen.getByTestId("redirect")).toBeInTheDocument();
  });

  it("returns to pricing on cancel without creating a session", () => {
    renderPage("/checkout?planId=plan-1", {
      checkout: {
        renderBeforeCheckout: questionnaire(() => Promise.resolve()),
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.queryByTestId("gate-plan")).not.toBeInTheDocument();
    expect(testState.sessionRequests).toHaveLength(0);
  });
});
