import type { ApiIdentity, ZudokuConfig, ZudokuPlugin } from "zudoku";
import { StarsIcon } from "zudoku/icons";
import { Link } from "zudoku/router";

import type { SubscriptionsResponse } from "./hooks/useSubscriptions.js";
import CheckoutConfirmPage from "./pages/CheckoutConfimPage.js";
import CheckoutFailedPage from "./pages/CheckoutFailedPage.js";
import CheckoutPage from "./pages/CheckoutPage.js";
import PricingPage from "./pages/PricingPage.js";
import SubscriptionsPage from "./pages/SubscriptionsPage.js";
import ZuploMonetizationWrapper, {
  client,
} from "./ZuploMonetizationWrapper.js";

export type ZudokuMonetizationPluginOptions = {
  environmentName: string;
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

const zuploMonetizationPlugin = (
  options: ZudokuMonetizationPluginOptions,
): ZudokuPlugin => {
  return {
    getIdentities: async (context) => {
      const result = await client.fetchQuery<SubscriptionsResponse>({
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
            path: "/checkout",
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
            element: <PricingPage environmentName={options.environmentName} />,
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
  };
};
