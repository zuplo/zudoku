import { useAuth, useZudoku } from "zudoku/hooks";
import { ShieldIcon } from "zudoku/icons";
import { useQuery } from "zudoku/react-query";
import { Link, useParams } from "zudoku/router";
import { Alert, AlertAction, AlertDescription } from "zudoku/ui/Alert";
import { Button } from "zudoku/ui/Button";
import { RedirectPage } from "../components/RedirectPage.js";
import { useDeploymentName } from "../hooks/useDeploymentName";
import { useUrlUtils } from "../hooks/useUrlUtils";

const CheckoutPage = () => {
  const { planId } = useParams();
  const zudoku = useZudoku();
  const auth = useAuth();
  const { generateUrl } = useUrlUtils();
  const deploymentName = useDeploymentName();

  if (!auth.profile?.email) {
    throw new Error(
      "No email found for user. Make sure your Authentication Provider exposes the email address.",
    );
  }

  if (!planId) {
    throw new Error(`missing planId`);
  }
  const email = auth.profile?.email;

  const successUrl = new URL(generateUrl("/checkout-confirm"));
  successUrl.searchParams.set("plan", planId);

  const checkoutLink = useQuery<{ url: string }>({
    queryKey: [deploymentName, planId, email],
    meta: {
      context: zudoku,
      request: {
        method: "POST",
        body: JSON.stringify({
          email,
          planId,
          successURL: successUrl.toString(),
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

export default CheckoutPage;
