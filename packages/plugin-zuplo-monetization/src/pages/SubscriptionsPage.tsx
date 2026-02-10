import { useMemo } from "react";
import { Head, Heading } from "zudoku/components";
import { useParams } from "zudoku/router";
import { Card, CardContent } from "zudoku/ui/Card";
import { useDeploymentName } from "../hooks/useDeploymentName";
import { useSubscriptions } from "../hooks/useSubscriptions";
import ActiveSubscription from "./subscriptions/ActiveSubscription";
import { SubscriptionsList } from "./subscriptions/SubscriptionsList";

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
          <ActiveSubscription
            key={activeSubscription.id}
            subscription={activeSubscription}
            deploymentName={deploymentName}
          />
        )}

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
