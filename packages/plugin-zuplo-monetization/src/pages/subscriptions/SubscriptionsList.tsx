import { cn } from "zudoku";
import { Link } from "zudoku/router";
import { Item, ItemContent, ItemTitle } from "zudoku/ui/Item";

interface Subscription {
  id: string;
  name: string;
  status: string;
  plan: {
    key: string;
    version: number;
  };
}

interface SubscriptionsListProps {
  subscriptions: Subscription[];
  activeSubscriptionId?: string;
}

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
              className={cn(
                isActive && "border-primary bg-primary/5 shadow-md",
              )}
            >
              <ItemContent>
                <ItemTitle>{subscription.name}</ItemTitle>
              </ItemContent>
            </Item>
          </Link>
        );
      })}
    </div>
  );
};
