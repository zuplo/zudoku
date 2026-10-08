import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "zudoku/router";
import {
  type BeforeCheckoutProps,
  MonetizationContext,
  type MonetizationConfig,
} from "../MonetizationContext.js";
import type { PricingPageResponse } from "../queries.js";
import type { Plan } from "../types/PlanType.js";
import type { Subscription } from "../types/SubscriptionType.js";
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
    generateUrl: (
      path: string,
      opts?: { searchParams?: Record<string, string> },
    ) =>
      opts?.searchParams
        ? `https://portal${path}?${new URLSearchParams(opts.searchParams)}`
        : `https://portal${path}`,
  }),
}));

type QueryOptions = {
  queryKey: unknown[];
  enabled?: boolean;
  meta?: { request?: { body?: string } };
};

const testState = vi.hoisted(() => ({
  /** Every Stripe Checkout Session query the tree mounted. */
  sessionRequests: [] as QueryOptions[],
  plans: { items: [] } as PricingPageResponse,
  subscriptions: {
    isPending: false,
    data: { items: [] as Array<Partial<Subscription>> },
  },
  subscriptionsQueryEnabled: undefined as boolean | undefined,
}));

vi.mock("../hooks/usePlans", () => ({
  usePlans: () => ({ data: testState.plans }),
}));

vi.mock("zudoku/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("zudoku/react-query")>();
  return {
    ...actual,
    useQuery: (options: QueryOptions) => {
      if (String(options.queryKey[0]).endsWith("/subscriptions")) {
        testState.subscriptionsQueryEnabled = options.enabled;
        return testState.subscriptions;
      }
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

const LocationProbe = () => {
  const location = useLocation();
  return (
    <div
      data-testid="location"
      data-path={`${location.pathname}${location.search}`}
    />
  );
};

const renderPage = (initialPath: string, config: MonetizationConfig = {}) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <MonetizationContext value={config}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MonetizationContext>
    </MemoryRouter>,
  );

const subscribeTo = (plan: Plan, status = "active") => {
  testState.subscriptions = {
    isPending: false,
    data: { items: [{ id: "sub-1", status, plan }] },
  };
};

const requestBody = (request: QueryOptions | undefined) =>
  JSON.parse(request?.meta?.request?.body ?? "{}");

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
    testState.subscriptions = { isPending: false, data: { items: [] } };
    testState.subscriptionsQueryEnabled = undefined;
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
    expect(requestBody(testState.sessionRequests[0])).toEqual({
      planId: "plan-1",
      successURL: "https://portal/checkout-confirm?planId=plan-1",
      cancelURL: "https://portal/pricing",
    });
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

  describe("with an existing subscription", () => {
    const pro = makePlan();
    const team = makePlan({ id: "plan-2", key: "team", name: "Team" });
    const starter = makePlan({ id: "plan-0", key: "starter", name: "Starter" });

    beforeEach(() => {
      testState.plans = { items: [starter, pro, team] };
    });

    it("waits for subscriptions before starting checkout", () => {
      testState.subscriptions = { isPending: true, data: { items: [] } };
      renderPage("/checkout?planId=plan-1");

      expect(screen.queryByTestId("redirect")).not.toBeInTheDocument();
      expect(testState.sessionRequests).toHaveLength(0);
    });

    it("sends a subscriber to their subscription when it's the same plan", () => {
      subscribeTo(pro);
      renderPage("/checkout?planId=plan-1");

      expect(screen.getByTestId("location")).toHaveAttribute(
        "data-path",
        "/subscriptions?subscriptionId=sub-1",
      );
      expect(testState.sessionRequests).toHaveLength(0);
    });

    it("starts the plan-change flow as an upgrade for a later plan", () => {
      subscribeTo(pro);
      renderPage("/checkout?planId=plan-2");

      expect(screen.getByTestId("redirect")).toHaveAttribute(
        "data-url",
        "https://stripe.test/session",
      );
      expect(testState.sessionRequests).toHaveLength(1);
      expect(requestBody(testState.sessionRequests[0])).toEqual({
        planId: "plan-2",
        successURL:
          "https://portal/subscription-change-confirm?planId=plan-2&subscriptionId=sub-1&mode=upgrade",
        cancelURL: "https://portal/subscriptions?subscriptionId=sub-1",
      });
    });

    it("starts the plan-change flow as a downgrade for an earlier plan", () => {
      subscribeTo(pro);
      renderPage("/checkout?planId=plan-0");

      expect(requestBody(testState.sessionRequests[0])).toMatchObject({
        planId: "plan-0",
        successURL:
          "https://portal/subscription-change-confirm?planId=plan-0&subscriptionId=sub-1&mode=downgrade",
      });
    });

    it("skips the questionnaire when changing plans", () => {
      subscribeTo(pro);
      const renderBeforeCheckout = vi.fn(() => <div>should not render</div>);
      renderPage("/checkout?planId=plan-2", {
        checkout: { renderBeforeCheckout },
      });

      expect(renderBeforeCheckout).not.toHaveBeenCalled();
      expect(testState.sessionRequests).toHaveLength(1);
    });

    it("sends a canceled subscription to its page instead of switching", () => {
      subscribeTo(pro, "canceled");
      renderPage("/checkout?planId=plan-2");

      expect(screen.getByTestId("location")).toHaveAttribute(
        "data-path",
        "/subscriptions?subscriptionId=sub-1",
      );
      expect(testState.sessionRequests).toHaveLength(0);
    });

    it("checks out as usual when the subscription is no longer current", () => {
      subscribeTo(pro, "inactive");
      renderPage("/checkout?planId=plan-2");

      expect(requestBody(testState.sessionRequests[0])).toMatchObject({
        successURL: "https://portal/checkout-confirm?planId=plan-2",
      });
    });

    it("checks out as usual when multiple subscriptions are allowed", () => {
      testState.plans = {
        items: [starter, pro, team],
        multipleSubscriptionsEnabled: true,
      };
      subscribeTo(pro);
      renderPage("/checkout?planId=plan-2");

      expect(testState.subscriptionsQueryEnabled).toBe(false);
      expect(requestBody(testState.sessionRequests[0])).toMatchObject({
        successURL: "https://portal/checkout-confirm?planId=plan-2",
      });
    });
  });
});
