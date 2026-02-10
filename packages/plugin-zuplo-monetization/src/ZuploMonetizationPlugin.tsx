import { type ApiIdentity, createPlugin } from "zudoku";
import { Button } from "zudoku/components";
import { CreditCardIcon, StarsIcon } from "zudoku/icons";
import { Link } from "zudoku/router";
import type { SubscriptionsResponse } from "./hooks/useSubscriptions";
import CheckoutConfirmPage from "./pages/CheckoutConfirmPage";
import CheckoutPage from "./pages/CheckoutPage";
import ManagePaymentPage from "./pages/ManagePaymentPage";
import PricingPage from "./pages/PricingPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import ZuploMonetizationWrapper, {
  queryClient,
} from "./ZuploMonetizationWrapper";

export type ZudokuMonetizationPluginOptions = {
  pricing?: {
    subtitle?: string;
    title?: string;
  };
};

const PRICING_PATH = "/pricing";

export const zuploMonetizationPlugin = createPlugin(
  (options?: ZudokuMonetizationPluginOptions) => ({
    transformConfig: ({ merge }) =>
      merge({
        slots: {
          "head-navigation-start": () => (
            <Button asChild variant="ghost">
              <Link to={PRICING_PATH}>Pricing</Link>
            </Button>
          ),
        },
      }),

    getIdentities: async (context) => {
      const deploymentName = context.env.ZUPLO_PUBLIC_DEPLOYMENT_NAME;
      if (!deploymentName) {
        throw new Error("ZUPLO_PUBLIC_DEPLOYMENT_NAME is not set");
      }

      const result = await queryClient.fetchQuery<SubscriptionsResponse>({
        queryKey: [`/v3/zudoku-metering/${deploymentName}/subscriptions`],
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
      {
        label: "Manage payment details",
        path: "/manage-payment",
        target: "_blank",
        icon: CreditCardIcon,
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
            {
              path: "/manage-payment",
              element: <ManagePaymentPage />,
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
              path: "/subscriptions/:subscriptionId?",
              element: <SubscriptionsPage />,
            },
          ],
        },
      ];
    },
    getProtectedRoutes: () => {
      return [
        "/checkout/*",
        "/checkout-confirm",
        "/subscriptions/*",
        "/manage-payment",
      ];
    },
  }),
);
