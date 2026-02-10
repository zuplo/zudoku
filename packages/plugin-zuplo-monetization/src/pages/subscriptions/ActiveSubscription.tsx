import { useZudoku } from "zudoku/hooks";
import { CheckCheckIcon } from "zudoku/icons";
import { useSuspenseQuery } from "zudoku/react-query";
import { useLocation } from "zudoku/router";
import { AlertDescription, AlertTitle } from "zudoku/ui/Alert";
import {
  DismissibleAlert,
  DismissibleAlertAction,
} from "zudoku/ui/DismissibleAlert";
import type { Subscription } from "../../hooks/useSubscriptions";
import { ApiKeysList } from "./ApiKeysList";
import { ManageSubscription } from "./ManageSubscription";
import { Usage, type UsageResult } from "./Usage";

type LocationState = {
  planSwitched?: { isUpgrade: boolean; newPlanName: string };
};

const ActiveSubscription = ({
  subscription,
  deploymentName,
}: {
  subscription: Subscription;
  deploymentName: string;
}) => {
  const zudoku = useZudoku();
  const location = useLocation();
  const planSwitched = (location.state as LocationState)?.planSwitched;

  const { data: usage } = useSuspenseQuery<UsageResult>({
    queryKey: [
      `/v3/zudoku-metering/${deploymentName}/subscriptions/${subscription.id}/usage`,
    ],
    refetchInterval: (query) =>
      query.state.data?.paymentStatus.status === "pending" ? 1500 : 30 * 1000,
    refetchOnWindowFocus: true,
    meta: { context: zudoku },
  });

  const isPendingFirstPayment =
    usage.paymentStatus.status === "pending" &&
    !usage.annotations?.["subscription.previous.id"];

  const activePhase = subscription?.phases.find(
    (p) =>
      new Date(p.activeFrom) <= new Date() &&
      (!p.activeTo || new Date(p.activeTo) >= new Date()),
  );

  return (
    <>
      {planSwitched && (
        <DismissibleAlert variant="info">
          <CheckCheckIcon className="size-4" />
          <AlertTitle>
            Plan {planSwitched.isUpgrade ? "upgraded" : "downgraded"}
          </AlertTitle>
          <AlertDescription>
            You have successfully switched to {planSwitched.newPlanName}.
          </AlertDescription>
          <DismissibleAlertAction />
        </DismissibleAlert>
      )}

      <Usage
        currentItems={activePhase?.items}
        usage={usage}
        subscription={subscription}
        isPendingFirstPayment={isPendingFirstPayment}
      />

      {subscription?.consumer?.apiKeys && (
        <ApiKeysList
          isPendingFirstPayment={isPendingFirstPayment}
          deploymentName={deploymentName}
          consumerId={subscription.consumer.id}
          apiKeys={subscription.consumer.apiKeys}
        />
      )}

      {activePhase && (
        <ManageSubscription
          subscription={subscription}
          planName={activePhase.name}
        />
      )}
    </>
  );
};

export default ActiveSubscription;
