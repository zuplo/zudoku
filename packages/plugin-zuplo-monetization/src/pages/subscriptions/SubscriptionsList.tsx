import { useMemo, useState } from "react";
import { cn } from "zudoku";
import { Button } from "zudoku/components";
import { Link } from "zudoku/router";
import { Badge } from "zudoku/ui/Badge";
import { Item, ItemContent, ItemDescription, ItemTitle } from "zudoku/ui/Item";
import { formatDurationInterval } from "../../utils/formatDuration";

interface Subscription {
  id: string;
  name: string;
  status: string;
  activeFrom: string;
  activeTo?: string;
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
  const groupedSubscriptions = useMemo(() => {
    return Object.groupBy(
      subscriptions.sort((a, b) => {
        if (a.activeTo && !b.activeTo) return 1;
        if (!a.activeTo && b.activeTo) return -1;

        return (
          new Date(b.activeTo ?? b.activeFrom).getTime() -
          new Date(a.activeTo ?? a.activeFrom).getTime()
        );
      }),
      (s) =>
        s.activeTo && new Date(s.activeTo) < new Date() ? "expired" : "running",
    );
  }, [subscriptions]);

  const [showAllSubscriptions, setShowAllSubscriptions] = useState(
    groupedSubscriptions.expired?.some((s) => s.id === activeSubscriptionId),
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {groupedSubscriptions.running?.map((subscription) => (
        <SubscriptionItem
          key={subscription.id}
          subscription={subscription}
          isSelected={activeSubscriptionId === subscription.id}
          isExpired={Boolean(
            subscription.activeTo &&
              new Date(subscription.activeTo) < new Date(),
          )}
        />
      ))}

      {showAllSubscriptions &&
        groupedSubscriptions.expired?.map((subscription) => (
          <SubscriptionItem
            key={subscription.id}
            subscription={subscription}
            isSelected={activeSubscriptionId === subscription.id}
            isExpired={Boolean(
              subscription.activeTo &&
                new Date(subscription.activeTo) < new Date(),
            )}
          />
        ))}

      {Boolean(groupedSubscriptions.expired?.length) && (
        <div className="self-center justify-self-center md:justify-self-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllSubscriptions(!showAllSubscriptions)}
          >
            {showAllSubscriptions ? "Hide" : "Show"} expired subscriptions
          </Button>
        </div>
      )}
    </div>
  );
};

const SubscriptionItem = ({
  subscription,
  isSelected,
  isExpired,
}: {
  subscription: Subscription;
  isSelected: boolean;
  isExpired: boolean;
}) => {
  const willExpire =
    subscription.activeTo && new Date(subscription.activeTo) > new Date();

  return (
    <Link to={`/subscriptions/${subscription.id}`} key={subscription.id}>
      <Item
        size="sm"
        key={subscription.id}
        variant="outline"
        className={cn(
          isSelected
            ? "border-primary bg-primary/5"
            : isExpired
              ? "opacity-50 hover:opacity-100 transition-opacity"
              : "border-muted bg-muted/5",
        )}
      >
        <ItemContent>
          <ItemTitle>
            <span>{subscription.name}</span>
            {subscription.activeTo ? (
              isExpired ? (
                <Badge variant="outline" className="capitalize">
                  Expired
                </Badge>
              ) : (
                <Badge variant="muted" className="capitalize">
                  Expiring
                </Badge>
              )
            ) : (
              <Badge className="capitalize">
                {formatDurationInterval(subscription.billingCadence)}
              </Badge>
            )}
          </ItemTitle>

          <ItemDescription className={cn(willExpire && "text-destructive")}>
            {subscription.activeTo
              ? willExpire
                ? "Expires on"
                : "Expired on"
              : "Started on"}{" "}
            {formatDate(subscription.activeTo ?? subscription.activeFrom)}
          </ItemDescription>
        </ItemContent>
      </Item>
    </Link>
  );
};
