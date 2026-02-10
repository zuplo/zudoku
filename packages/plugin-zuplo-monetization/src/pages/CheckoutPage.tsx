import { useAuth, useZudoku } from "zudoku/hooks";
import { ShieldIcon } from "zudoku/icons";
import { useQuery } from "zudoku/react-query";
import { useParams } from "zudoku/router";
import { RedirectPage } from "../components/RedirectPage.js";
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
            generateUrl("/checkout-confirm") +
            (selectedPlan.id ? `?plan=${selectedPlan.id}` : ""),
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
    />
  );
};

export default CheckoutPage;
