import { type ApiIdentity, createPlugin, type ZudokuConfig } from "zudoku";
import { StarsIcon } from "zudoku/icons";
import { Link } from "zudoku/router";
import type { SubscriptionsResponse } from "./hooks/useSubscriptions";
import CheckoutConfirmPage from "./pages/CheckoutConfimPage";
import CheckoutFailedPage from "./pages/CheckoutFailedPage";
import CheckoutPage from "./pages/CheckoutPage";
import PricingPage from "./pages/PricingPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import ZuploMonetizationWrapper, {
  queryClient,
} from "./ZuploMonetizationWrapper";

export type ZudokuMonetizationPluginOptions = {
  environmentName: string;
  pricing: {
    subtitle: string;
    title: string;
  };
};

const PRICING_PATH = "/pricing";

export const enableMonetization = (
  config: ZudokuConfig,
  options: ZudokuMonetizationPluginOptions,
): ZudokuConfig => {
  return {
    ...config,
    plugins: [...(config.plugins ?? []), zuploMonetizationPlugin(options)],
    slots: {
      "head-navigation-start": () => {
        return <Link to={PRICING_PATH}>Pricing</Link>;
      },
    },
  };
};

export const zuploMonetizationPlugin = createPlugin(
  (options: ZudokuMonetizationPluginOptions) => ({
    getIdentities: async (context) => {
      const result = await queryClient.fetchQuery<SubscriptionsResponse>({
        queryKey: [
          `/v3/zudoku-metering/${options.environmentName}/subscriptions`,
        ],
        meta: {
          context,
        },
      });

      return result.items.flatMap((item) =>
        item.consumer.apiKeys.map(
          (apiKey) =>
            ({
              label: item.name,
              id: apiKey.id,
              authorizeRequest: async (request) => {
                return new Request(request, {
                  headers: {
                    Authorization: `Bearer ${apiKey.key}`,
                  },
                });
              },
              authorizationFields: {
                headers: ["Authorization"],
              },
            }) satisfies ApiIdentity,
        ),
      );
    },

    getProfileMenuItems: () => [
      {
        label: "My Subscriptions",
        path: "/subscriptions",
        icon: StarsIcon,
      },
    ],
    getRoutes: () => [
      {
        Component: ZuploMonetizationWrapper,
        handle: {
          layout: "none",
        },
        children: [
          {
            path: "/checkout/:planId?",
            element: <CheckoutPage environmentName={options.environmentName} />,
          },
          {
            path: "/checkout-confirm",
            element: (
              <CheckoutConfirmPage environmentName={options.environmentName} />
            ),
          },
        ],
      },
      {
        Component: ZuploMonetizationWrapper,
        children: [
          {
            path: "/pricing",
            element: (
              <PricingPage
                environmentName={options.environmentName}
                subtext={options.pricing.subtitle}
                title={options.pricing.title}
              />
            ),
          },
          {
            path: "/checkout-failed",
            element: <CheckoutFailedPage />,
          },
          {
            path: "/subscriptions/:subscriptionId?",
            element: (
              <SubscriptionsPage environmentName={options.environmentName} />
            ),
          },
        ],
      },
    ],
    getProtectedRoutes: () => {
      return ["/checkout", "/checkout-success", "/checkout-failed"];
    },
  }),
);
