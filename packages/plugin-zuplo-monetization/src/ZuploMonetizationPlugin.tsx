import { type ApiIdentity, createPlugin } from "zudoku";
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
  environmentName?: string;
  pricing?: {
    subtitle?: string;
    title?: string;
  };
};

const PRICING_PATH = "/pricing";

export const zuploMonetizationPlugin = createPlugin(
  (options?: ZudokuMonetizationPluginOptions) => ({
    transformConfig: (config) => {
      return {
        ...config,
        slots: {
          "head-navigation-start": () => {
            return <Link to={PRICING_PATH}>Pricing</Link>;
          },
        },
      };
    },

    initialize: (context) => {
      if (
        !context.env.ZUPLO_PUBLIC_DEPLOYMENT_NAME ||
        options?.environmentName
      ) {
        throw new Error("ZUPLO_PUBLIC_DEPLOYMENT_NAME is not set");
      }
    },

    getIdentities: async (context) => {
      const result = await queryClient.fetchQuery<SubscriptionsResponse>({
        queryKey: [
          `/v3/zudoku-metering/${context.env.ZUPLO_PUBLIC_DEPLOYMENT_NAME}/subscriptions`,
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
                request.headers.set("Authorization", `Bearer ${apiKey.key}`);
                return request;
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
    getRoutes: () => {
      return [
        {
          Component: ZuploMonetizationWrapper,
          handle: {
            layout: "none",
          },
          children: [
            {
              path: "/checkout/:planId?",
              element: <CheckoutPage />,
            },
            {
              path: "/checkout-confirm",
              element: <CheckoutConfirmPage />,
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
                  subtitle={options?.pricing?.subtitle}
                  title={options?.pricing?.title}
                />
              ),
            },
            {
              path: "/checkout-failed",
              element: <CheckoutFailedPage />,
            },
            {
              path: "/subscriptions/:subscriptionId?",
              element: <SubscriptionsPage />,
            },
          ],
        },
      ];
    },
    getProtectedRoutes: () => {
      return ["/checkout/*", "/checkout-success", "/checkout-failed"];
    },
  }),
);
