import { useZudoku } from "zudoku/hooks";
import { CreditCardIcon } from "zudoku/icons";
import { useQuery } from "zudoku/react-query";
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
    />
  );
};

export default ManagePaymentPage;
