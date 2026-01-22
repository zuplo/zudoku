import { cn } from "zudoku";
import { Link } from "zudoku/router";
import { Badge } from "zudoku/ui/Badge";
import { Item, ItemContent, ItemDescription, ItemTitle } from "zudoku/ui/Item";
import { formatDurationInterval } from "../../utils/formatDuration";

interface Subscription {
  id: string;
  name: string;
  status: string;
  activeFrom: string;
  billingCadence: string;
  plan: {
    key: string;
    version: number;
  };
}

interface SubscriptionsListProps {
  subscriptions: Subscription[];
  activeSubscriptionId?: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const SubscriptionsList = ({
  subscriptions,
  activeSubscriptionId,
}: SubscriptionsListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {subscriptions.map((subscription) => {
        const isActive = activeSubscriptionId === subscription.id;
        return (
          <Link to={`/subscriptions/${subscription.id}`} key={subscription.id}>
            <Item
              size="sm"
              key={subscription.id}
              variant="outline"
              className={cn(isActive && "border-primary bg-primary/5")}
            >
              <ItemContent>
                <ItemTitle>
                  {subscription.name}
                  <Badge className="capitalize">
                    {formatDurationInterval(subscription.billingCadence)}
                  </Badge>
                </ItemTitle>

                <ItemDescription>
                  Started: {formatDate(subscription.activeFrom)}
                </ItemDescription>
              </ItemContent>
            </Item>
          </Link>
        );
      })}
    </div>
  );
};
