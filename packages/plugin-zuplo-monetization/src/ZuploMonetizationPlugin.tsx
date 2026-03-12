import { type ApiIdentity, createPlugin } from "zudoku";
import { CreditCardIcon, StarsIcon } from "zudoku/icons";
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
    units?: Record<string, string>;
    showYearlyPrice?: boolean;
  };
};

const PRICING_PATH = "/pricing";

export const zuploMonetizationPlugin = createPlugin(
  (options?: ZudokuMonetizationPluginOptions) => ({
    transformConfig: ({ config, merge }) =>
      merge({
        apiKeys: { enabled: false },
        header: {
          navigation: [
            ...(config.header?.navigation ?? []),
            { label: "Pricing", to: PRICING_PATH },
          ],
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

      return result.items.flatMap((sub) =>
        sub.status !== "active"
          ? []
          : sub.consumer.apiKeys.flatMap((apiKey) =>
              apiKey.expiresOn && new Date(apiKey.expiresOn) < new Date()
                ? []
                : ({
                    label: `${sub.name} (****${apiKey.key.slice(-5)})`,
                    id: apiKey.id,
                    authorizeRequest: async (request) => {
                      request.headers.set(
                        "Authorization",
                        `Bearer ${apiKey.key}`,
                      );
                      return request;
                    },
                    authorizationFields: {
                      headers: ["Authorization"],
                    },
                  } satisfies ApiIdentity),
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
            {
              path: PRICING_PATH,
              handle: { layout: "default" },
              element: (
                <PricingPage
                  subtitle={options?.pricing?.subtitle}
                  title={options?.pricing?.title}
                  units={options?.pricing?.units}
                  showYearlyPrice={options?.pricing?.showYearlyPrice}
                />
              ),
            },
            {
              handle: { layout: "default" },
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
