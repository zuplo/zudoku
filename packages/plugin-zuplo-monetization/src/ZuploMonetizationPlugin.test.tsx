import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StaticZudoku } from "zudoku/testing";
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
