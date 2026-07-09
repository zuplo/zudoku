import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ZudokuContext } from "zudoku";
import { StaticZudoku } from "zudoku/testing";
import { pricingPageQuery } from "./queries.js";
import type { Plan } from "./types/PlanType.js";
import { zuploMonetizationPlugin } from "./ZuploMonetizationPlugin";
import { queryClient } from "./ZuploMonetizationWrapper";

// PricingPage currently derives the legend from `items[0]` before the empty-state branch.
// In integration tests we mock the helper to avoid throwing when `items` is empty.
vi.mock("./utils/pricingTaxLegend.js", async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    collectDefaultTaxBehaviors: (plan?: Plan) => {
      if (!plan) return "unspecified";
      const behavior = plan.defaultTaxConfig?.behavior;
      if (typeof behavior !== "string" || behavior.trim().length === 0) {
        return "unspecified";
      }
      const key = behavior.trim().toLowerCase();
      if (key === "exclusive" || key === "tax_exclusive") return "exclusive";
      if (key === "inclusive" || key === "tax_inclusive") return "inclusive";
      return "unspecified";
    },
    taxBehaviorLegendSentence: (behavior: string) => {
      const key = behavior.trim().toLowerCase();
      if (key === "exclusive") {
        return "Prices exclude tax; taxes may be added at checkout if applicable.";
      }
      if (key === "inclusive") return "Prices include tax where applicable.";
      return undefined;
    },
  };
});

describe("PricingPage", () => {
  it("renders pricing page with empty plans", async () => {
    queryClient.setQueryData(["/v3/zudoku-metering/test/subscriptions"], {
      items: [],
    });
    queryClient.setQueryData(["/v3/zudoku-metering/test/pricing-page"], {
      items: [],
    });

    await act(async () => {
      render(
        <StaticZudoku
          env={{ ZUPLO_PUBLIC_DEPLOYMENT_NAME: "test" }}
          plugins={[
            zuploMonetizationPlugin({
              pricing: {
                title: "Pricing My App",
                subtitle:
                  "See our pricing options and choose the one that best suits your needs.",
              },
            }),
          ]}
          path="/pricing"
        />,
      );
    });

    expect(screen.getByTestId("title")).toHaveTextContent("Pricing My App");
    expect(screen.getByTestId("subtitle")).toHaveTextContent(
      "See our pricing options and choose the one that best suits your needs.",
    );
  });
});

describe("pricing query signing after logout", () => {
  // Simulates the OpenID end_session logout race: the pricing prefetch is
  // built while localStorage still says authenticated, but by the time the
  // request fires the logout callback has cleared auth state.
  const createFakeContext = (authState: { isAuthenticated: boolean }) => {
    const signRequest = vi.fn(async (_request: Request): Promise<Request> => {
      throw new Error("Invalid or incompatible provider data");
    });
    const context = {
      env: { ZUPLO_PUBLIC_DEPLOYMENT_NAME: "test" },
      getAuthState: () => authState,
      signRequest,
    } as unknown as ZudokuContext;
    return { context, signRequest };
  };

  beforeEach(() => {
    queryClient.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ items: [] }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    );
  });

  afterEach(() => {
    queryClient.clear();
    vi.unstubAllGlobals();
  });

  it("fetches unsigned when logged out after the query was built", async () => {
    const authState = { isAuthenticated: true };
    const { context, signRequest } = createFakeContext(authState);

    const opts = pricingPageQuery(context);
    authState.isAuthenticated = false;

    await queryClient.prefetchQuery(opts);

    expect(signRequest).not.toHaveBeenCalled();
    expect(queryClient.getQueryState(opts.queryKey)?.status).toBe("success");
  });

  it("renders /pricing after a logout-poisoned prefetch", async () => {
    const authState = { isAuthenticated: true };
    const { context } = createFakeContext(authState);

    const opts = pricingPageQuery(context);
    authState.isAuthenticated = false;
    await queryClient.prefetchQuery(opts);

    await act(async () => {
      render(
        <StaticZudoku
          env={{ ZUPLO_PUBLIC_DEPLOYMENT_NAME: "test" }}
          plugins={[zuploMonetizationPlugin({ pricing: { title: "Pricing" } })]}
          path="/pricing"
        />,
      );
    });

    expect(screen.getByTestId("title")).toHaveTextContent("Pricing");
  });

  it("signs the request when authenticated at fetch time", async () => {
    const authState = { isAuthenticated: true };
    const { context, signRequest } = createFakeContext(authState);
    signRequest.mockImplementation(async (request: Request) => request);

    await queryClient.prefetchQuery(pricingPageQuery(context));

    expect(signRequest).toHaveBeenCalledOnce();
  });
});
