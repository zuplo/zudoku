import { useZudoku } from "zudoku/hooks";
import { useSuspenseQuery } from "zudoku/react-query";
import type { Subscription } from "../../hooks/useSubscriptions";
import { ApiKeysList } from "./ApiKeysList";
import { ManageSubscription } from "./ManageSubscription";
import { Usage, type UsageResult } from "./Usage";

const ActiveSubscription = ({
  subscription,
  deploymentName,
}: {
  subscription: Subscription;
  deploymentName: string;
}) => {
  const zudoku = useZudoku();
  const { data: usage } = useSuspenseQuery<UsageResult>({
    queryKey: [
      `/v3/zudoku-metering/${deploymentName}/subscriptions/${subscription.id}/usage`,
    ],
    refetchInterval: (query) =>
      query.state.data?.paymentStatus.status === "pending" ? 1500 : 30 * 1000,
    refetchOnWindowFocus: true,
    meta: { context: zudoku },
  });

  const activePhase = subscription?.phases.find(
    (p) =>
      new Date(p.activeFrom) <= new Date() &&
      (!p.activeTo || new Date(p.activeTo) >= new Date()),
  );

  return (
    <>
      <Usage currentItems={activePhase?.items} usage={usage} />

      {subscription?.consumer?.apiKeys && (
        <ApiKeysList
          keysAvailable={
            usage.paymentStatus.status === "pending" &&
            !usage.annotations?.["subscription.previous.id"]
          }
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
