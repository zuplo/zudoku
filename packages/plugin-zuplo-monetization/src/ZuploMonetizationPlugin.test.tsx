import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StaticZudoku } from "zudoku/testing";
import { zuploMonetizationPlugin } from "./ZuploMonetizationPlugin";
import { queryClient } from "./ZuploMonetizationWrapper";

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
