import { useEffect } from "react";
import { useAuth, useZudoku } from "zudoku/hooks";
import { ShieldIcon } from "zudoku/icons";
import { useQuery } from "zudoku/react-query";
import { useParams } from "zudoku/router";
import { useDeploymentName } from "../hooks/useDeploymentName";
import { usePlans } from "../hooks/usePlans";
import { useUrlUtils } from "../hooks/useUrlUtils";

const CheckoutPage = () => {
  const { planId } = useParams();
  const zudoku = useZudoku();
  const auth = useAuth();
  const { generateUrl } = useUrlUtils();
  const deploymentName = useDeploymentName();
  const plans = usePlans(deploymentName);
  const selectedPlan = plans.data?.items.find((plan) => plan.id === planId);

  if (!auth.profile?.email) {
    throw new Error(
      "No email found for user. Make sure your Authentication Provider exposes the email address.",
    );
  }

  if (!selectedPlan) {
    throw new Error(`Invalid plan id: ${planId}`);
  }

  const checkoutLink = useQuery<{ url: string }>({
    queryKey: [`/v3/zudoku-metering/${deploymentName}/stripe/checkout`],
    meta: {
      context: zudoku,
      request: {
        method: "POST",
        body: JSON.stringify({
          email: auth.profile?.email,
          planId: selectedPlan.id,
          successURL:
            generateUrl(`/checkout-confirm`) +
            (selectedPlan.id ? `?plan=${selectedPlan.id}` : ""),
          cancelURL:
            generateUrl(`/checkout-failed`) +
            (selectedPlan.id ? `?plan=${selectedPlan.id}` : ""),
        }),
      },
    },
  });

  useEffect(() => {
    if (checkoutLink.data?.url) {
      window.location.href = checkoutLink.data.url;
    }
  }, [checkoutLink.data]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="flex max-w-md flex-col items-center space-y-6 text-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-foreground/10">
            <ShieldIcon className="w-12 h-12 text-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-card-foreground">
            Establishing encrypted connection...
          </h2>
          <p className="text-muted-foreground">
            Setting up your secure checkout experience
          </p>
          <p className="text-sm text-muted-foreground">
            Powered by Stripe for maximum security
          </p>
        </div>

        <div className="flex space-x-2">
          <div className="h-3 w-3 animate-pulse rounded-full bg-primary [animation-delay:-0.3s]"></div>
          <div className="h-3 w-3 animate-pulse rounded-full bg-primary [animation-delay:-0.15s]"></div>
          <div className="h-3 w-3 animate-pulse rounded-full bg-primary"></div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
