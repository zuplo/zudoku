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

const CheckoutRedirect = ({ planId }: { planId: string }) => {
  const zudoku = useZudoku();
  const auth = useAuth();
  const { generateUrl } = useUrlUtils();
  const deploymentName = useDeploymentName();

  const checkoutLink = useQuery<{ url: string }>({
    queryKey: [
      `/v3/zudoku-metering/${deploymentName}/stripe/checkout`,
      planId,
      auth.profile?.sub,
    ],
    meta: {
      context: zudoku,
      request: {
        method: "POST",
        body: JSON.stringify({
          planId,
          successURL: generateUrl("/checkout-confirm", {
            searchParams: { planId },
          }),
          cancelURL: generateUrl("/pricing"),
        }),
      },
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
 */
const CheckoutFlow = ({ planId }: { planId: string }) => {
  const { checkout } = useMonetizationConfig();
  const navigate = useNavigate();
  const [answered, setAnswered] = useState(false);
  const { data } = usePlans();

  const plan = data.items.find((item) => item.id === planId);

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

  return gate ?? <CheckoutRedirect planId={planId} />;
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
