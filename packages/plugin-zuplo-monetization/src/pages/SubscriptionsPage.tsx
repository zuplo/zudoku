import { useMemo } from "react";
import { useParams } from "zudoku/router";
import { Card, CardContent } from "zudoku/ui/Card";
import { useDeploymentName } from "../hooks/useDeploymentName";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { ApiKeysList } from "./subscriptions/ApiKeysList";
import { ManageSubscription } from "./subscriptions/ManageSubscription";
import { SubscriptionsList } from "./subscriptions/SubscriptionsList";
import { Usage } from "./subscriptions/Usage";

const SubscriptionsPage = () => {
  const deploymentName = useDeploymentName();
  const { data } = useSubscriptions(deploymentName);
  const { subscriptionId } = useParams();
  const subscriptions = data?.items ?? [];

  const activeSubscription = useMemo(() => {
    if (subscriptions.length === 0) return null;
    if (subscriptionId) {
      return (
        subscriptions.find((s) => s.id === subscriptionId) ?? subscriptions[0]
      );
    }
    return subscriptions[0];
  }, [subscriptions, subscriptionId]);

  const activePhase = activeSubscription?.phases.find(
    (p) =>
      new Date(p.activeFrom) <= new Date() &&
      (!p.activeTo || new Date(p.activeTo) >= new Date()),
  );

  return (
    <div className="w-full py-12">
      <div className="max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            My Subscriptions
          </h1>
          <p className="text-base text-muted-foreground">
            Manage your subscriptions, usage, and API keys
          </p>
        </div>

        <SubscriptionsList
          subscriptions={subscriptions}
          activeSubscriptionId={activeSubscription?.id}
        />

        {activeSubscription && (
          <Usage
            subscriptionId={activeSubscription?.id}
            environmentName={deploymentName}
            currentItems={activePhase?.items}
          />
        )}

        {activeSubscription?.consumer?.apiKeys && (
          <ApiKeysList
            deploymentName={deploymentName}
            consumerId={activeSubscription.consumer.id}
            apiKeys={activeSubscription.consumer.apiKeys}
          />
        )}

        {activeSubscription && activePhase && (
          <ManageSubscription
            subscription={activeSubscription}
            planName={activePhase.name}
          />
        )}

        {/* Empty state */}
        {subscriptions.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No active subscriptions found.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsPage;
