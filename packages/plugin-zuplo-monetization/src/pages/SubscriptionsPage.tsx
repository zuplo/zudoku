import { useMemo } from "react";
import { Head, Heading } from "zudoku/components";
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
    <div className="w-full pt-(--padding-content-top) pb-(--padding-content-bottom)">
      <Head>
        <title>My Subscriptions</title>
      </Head>
      <div className="max-w-4xl space-y-8">
        <div>
          <Heading level={2}>My Subscriptions</Heading>
          <p className="text-muted-foreground">
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
