import { useEffect, useMemo } from "react";
import { useParams } from "zudoku/router";
import { Card, CardContent } from "zudoku/ui/Card";

import { useSubscriptions } from "../hooks/useSubscriptions";
import { ApiKeysList } from "./subscriptions/ApiKeysList";
import { SubscriptionsList } from "./subscriptions/SubscriptionsList";
import { Usage } from "./subscriptions/Usage";

const SubscriptionsPage = ({
  environmentName,
}: {
  environmentName: string;
}) => {
  const { data } = useSubscriptions(environmentName);
  const { subscriptionId } = useParams();
  const subscriptions = data?.items ?? [];

  useEffect(() => {
    console.log("SubscriptionsPage mounted");
  }, []);

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
            environmentName={environmentName}
          />
        )}

        {activeSubscription?.consumer?.apiKeys && (
          <ApiKeysList
            deploymentName={environmentName}
            consumerId={activeSubscription.consumer.id}
            apiKeys={activeSubscription.consumer.apiKeys}
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
