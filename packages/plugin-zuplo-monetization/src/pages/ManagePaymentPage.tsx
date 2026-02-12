import { Link } from "zudoku/components";
import { useZudoku } from "zudoku/hooks";
import { CreditCardIcon } from "zudoku/icons";
import { useQuery } from "zudoku/react-query";
import { Alert, AlertAction, AlertDescription } from "zudoku/ui/Alert";
import { Button } from "zudoku/ui/Button";
import { RedirectPage } from "../components/RedirectPage.js";
import { useDeploymentName } from "../hooks/useDeploymentName.js";
import { useUrlUtils } from "../hooks/useUrlUtils.js";

const ManagePaymentPage = () => {
  const zudoku = useZudoku();
  const { generateUrl } = useUrlUtils();
  const deploymentName = useDeploymentName();

  const billingPortal = useQuery<{ url: string }>({
    queryKey: [`/v3/zudoku-metering/${deploymentName}/stripe/portal`],
    meta: {
      context: zudoku,
      request: {
        method: "POST",
        body: JSON.stringify({
          returnURL: generateUrl("/subscriptions"),
        }),
      },
    },
  });

  return (
    <RedirectPage
      icon={CreditCardIcon}
      title="Redirecting to payment portal..."
      description="Setting up your secure connection"
      url={billingPortal.data?.url}
    >
      {billingPortal.isError && (
        <Alert variant="destructive">
          <AlertDescription className="first-letter:uppercase">
            {billingPortal.error.message}
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

export default ManagePaymentPage;
