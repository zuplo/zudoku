import { Suspense } from "react";
import { type ApiIdentity, createPlugin } from "zudoku";
import { CreditCardIcon, StarsIcon } from "zudoku/icons";
import type { SubscriptionsResponse } from "./hooks/useSubscriptions";
import type { MonetizationConfig } from "./MonetizationContext.js";
import CheckoutConfirmPage from "./pages/CheckoutConfirmPage";
import CheckoutPage from "./pages/CheckoutPage";
import ManagePaymentPage from "./pages/ManagePaymentPage";
import PricingPage from "./pages/PricingPage";
import { PricingPageSkeleton } from "./pages/PricingPageSkeleton";
import SubscriptionChangeConfirmPage from "./pages/SubscriptionChangeConfirmPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import { SubscriptionsPageSkeleton } from "./pages/SubscriptionsPageSkeleton";
import ZuploMonetizationWrapper, {
  queryClient,
} from "./ZuploMonetizationWrapper";

const PRICING_PATH = "/pricing";

export const zuploMonetizationPlugin = createPlugin(
  (options: MonetizationConfig = {}) => ({
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
        // Full-page routes without Layout (checkout, redirects, etc.)
        {
          element: <ZuploMonetizationWrapper options={options} />,
          handle: { layout: "none" },
          children: [
            {
              path: "/checkout",
              element: <CheckoutPage />,
            },
            {
              path: "/checkout-confirm",
              element: <CheckoutConfirmPage />,
            },
            {
              path: "/subscription-change-confirm",
              element: <SubscriptionChangeConfirmPage />,
            },
            {
              path: "/manage-payment",
              element: <ManagePaymentPage />,
            },
          ],
        },
        // Routes that share the default Layout with other plugins
        {
          element: <ZuploMonetizationWrapper options={options} />,
          children: [
            {
              path: PRICING_PATH,
              element: (
                <Suspense fallback={<PricingPageSkeleton />}>
                  <PricingPage />
                </Suspense>
              ),
            },
            {
              path: "/subscriptions",
              element: (
                <Suspense fallback={<SubscriptionsPageSkeleton />}>
                  <SubscriptionsPage />
                </Suspense>
              ),
            },
          ],
        },
      ];
    },
    getProtectedRoutes: () => {
      return [
        "/checkout",
        "/checkout-confirm",
        "/subscription-change-confirm",
        "/subscriptions",
        "/manage-payment",
      ];
    },
  }),
);
