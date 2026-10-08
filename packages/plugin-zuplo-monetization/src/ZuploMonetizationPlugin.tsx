import { type ApiIdentity, createPlugin } from "zudoku";
import { CreditCardIcon, StarsIcon } from "zudoku/icons";
import type { MonetizationConfig } from "./MonetizationContext.js";
import CheckoutConfirmPage from "./pages/CheckoutConfirmPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentMethodsPage from "./pages/PaymentMethodsPage";
import PricingPage from "./pages/PricingPage";
import SubscriptionChangeConfirmPage from "./pages/SubscriptionChangeConfirmPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import { pricingPageQuery, subscriptionsQuery } from "./queries.js";
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

    initialize: (context) => {
      // Warm the cache so /pricing and /subscriptions render their data
      // synchronously on navigation instead of suspending into a skeleton.
      void queryClient.prefetchQuery(pricingPageQuery(context));
      if (context.getAuthState().isAuthenticated) {
        void queryClient.prefetchQuery(subscriptionsQuery(context));
      }
    },

    events: {
      auth: ({ prev, next }) => {
        // Drop cached user-scoped data (and any entry poisoned by a signed
        // request that raced the logout) so nothing survives into the
        // anonymous session.
        if (prev.isAuthenticated && !next.isAuthenticated) {
          queryClient.removeQueries();
        }
      },
    },

    getIdentities: async (context) => {
      // Subscriptions require auth; unexpected failures are handled by
      // `getApiIdentities`, which settles plugins individually.
      if (!context.getAuthState().isAuthenticated) return [];

      const result = await queryClient.fetchQuery(subscriptionsQuery(context));

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
          ],
        },
        // Routes that share the default Layout with other plugins
        {
          element: <ZuploMonetizationWrapper options={options} />,
          children: [
            {
              path: PRICING_PATH,
              element: <PricingPage />,
            },
            {
              path: "/subscriptions",
              element: <SubscriptionsPage />,
            },
            {
              path: "/manage-payment",
              element: <PaymentMethodsPage />,
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
