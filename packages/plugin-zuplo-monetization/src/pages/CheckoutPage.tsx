import { Suspense, useState } from "react";
import { useAuth, useZudoku } from "zudoku/hooks";
import { ShieldIcon } from "zudoku/icons";
import { useQuery } from "zudoku/react-query";
import { Link, Navigate, useNavigate, useSearchParams } from "zudoku/router";
import { Alert, AlertAction, AlertDescription } from "zudoku/ui/Alert";
import { Button } from "zudoku/ui/Button";
import { RedirectPage } from "../components/RedirectPage.js";
import { useDeploymentName } from "../hooks/useDeploymentName";
import { usePlans } from "../hooks/usePlans";
import { useUrlUtils } from "../hooks/useUrlUtils";
import { useMonetizationConfig } from "../MonetizationContext";
import { subscriptionsQuery } from "../queries.js";
import {
  isNewerPlanVersion,
  planChangeCheckoutBody,
  resolvePlanChangeMode,
  type StripeCheckoutBody,
} from "../utils/planChange.js";

const CheckoutRedirect = ({ body }: { body: StripeCheckoutBody }) => {
  const zudoku = useZudoku();
  const auth = useAuth();
  const deploymentName = useDeploymentName();

  const checkoutLink = useQuery<{ url: string }>({
    queryKey: [
      `/v3/zudoku-metering/${deploymentName}/stripe/checkout`,
      body.planId,
      body.successURL,
      auth.profile?.sub,
    ],
    meta: {
      context: zudoku,
      request: { method: "POST", body: JSON.stringify(body) },
    },
  });

  return (
    <RedirectPage
      icon={ShieldIcon}
      title="Establishing encrypted connection..."
      description="Setting up your secure checkout experience"
      url={checkoutLink.data?.url}
    >
      {checkoutLink.isError && (
        <Alert variant="destructive">
          <AlertDescription className="first-letter:uppercase">
            {checkoutLink.error.message}
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="xs" asChild>
              <Link to="/subscriptions">Back</Link>
            </Button>
          </AlertAction>
        </Alert>
      )}
    </RedirectPage>
  );
};

/**
 * Neutral placeholder while the plan catalog resolves — deliberately says
 * nothing about Stripe, since a questionnaire may come first. In practice the
 * catalog is already warm: the plugin prefetches it on initialize.
 */
const CheckoutLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-muted">
    <div className="flex space-x-2">
      <div className="h-3 w-3 animate-pulse rounded-full bg-primary [animation-delay:-0.3s]" />
      <div className="h-3 w-3 animate-pulse rounded-full bg-primary [animation-delay:-0.15s]" />
      <div className="h-3 w-3 animate-pulse rounded-full bg-primary" />
    </div>
  </div>
);

/**
 * Renders `checkout.renderBeforeCheckout` — if configured — before handing off
 * to Stripe. `CheckoutRedirect` only mounts once the gate is satisfied, so the
 * Checkout Session is created after the questionnaire rather than while the
 * user is still filling it in (a session minted on mount would sit there
 * expiring).
 *
 * Unless the bucket allows multiple subscriptions, a user who already holds
 * one can't start another (the metering API answers 409), so they're routed
 * into the same plan-change flow `SwitchPlanModal` uses instead.
 */
const CheckoutFlow = ({ planId }: { planId: string }) => {
  const zudoku = useZudoku();
  const { checkout } = useMonetizationConfig();
  const navigate = useNavigate();
  const { generateUrl } = useUrlUtils();
  const [answered, setAnswered] = useState(false);
  const { data } = usePlans();
  const multipleSubscriptionsEnabled =
    data.multipleSubscriptionsEnabled ?? false;
  // The cached list (prefetched on initialize, 5 min staleTime) may predate a
  // subscription made elsewhere, so decide on a fresh fetch.
  const subscriptions = useQuery({
    ...subscriptionsQuery(zudoku),
    enabled: !multipleSubscriptionsEnabled,
    refetchOnMount: "always",
  });

  const plan = data.items.find((item) => item.id === planId);

  if (!multipleSubscriptionsEnabled) {
    if (!subscriptions.isFetchedAfterMount) return <CheckoutLoading />;

    // Same notion of "subscribed" as the pricing page. If the lookup failed,
    // ignore any cached list and fall through to a regular checkout as before.
    const items = subscriptions.isError
      ? []
      : (subscriptions.data?.items ?? []);
    const existing =
      items.find((s) => s.status === "active") ??
      items.find((s) => s.status === "canceled");

    if (existing) {
      const manageExisting = (
        <Navigate
          to={`/subscriptions?subscriptionId=${encodeURIComponent(existing.id)}`}
          replace
        />
      );

      // Only an active subscription can switch plans. A canceled one (ending
      // at period end) is managed — or resumed — from its subscription page.
      // An unknown plan id leaves nothing to switch to.
      if (existing.status !== "active" || !plan) return manageExisting;

      // Already on this plan: the same id, or the same plan key at the same
      // or a newer version (e.g. a link to an outdated plan version).
      const isCurrentPlan =
        existing.plan.id === plan.id ||
        (existing.plan.key === plan.key &&
          !isNewerPlanVersion(existing.plan, plan));
      if (isCurrentPlan) return manageExisting;

      return (
        <CheckoutRedirect
          body={planChangeCheckoutBody(
            {
              planId: plan.id,
              subscriptionId: existing.id,
              mode: resolvePlanChangeMode({
                catalog: data.items,
                subscribedPlan: existing.plan,
                target: plan,
              }),
            },
            generateUrl,
          )}
        />
      );
    }
  }

  // An unknown plan id (an archived plan, a hand-edited URL) leaves nothing to
  // hand the questionnaire, so checkout proceeds and the metering API rejects
  // the id exactly as it did before this gate existed.
  const gate =
    answered || !plan
      ? null
      : checkout?.renderBeforeCheckout?.({
          plan,
          onComplete: () => setAnswered(true),
          onCancel: () => navigate("/pricing"),
        });

  return (
    gate ?? (
      <CheckoutRedirect
        body={{
          planId,
          successURL: generateUrl("/checkout-confirm", {
            searchParams: { planId },
          }),
          cancelURL: generateUrl("/pricing"),
        }}
      />
    )
  );
};

const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("planId");

  if (!planId) {
    return <Navigate to="/pricing" replace />;
  }

  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutFlow planId={planId} />
    </Suspense>
  );
};

export default CheckoutPage;
