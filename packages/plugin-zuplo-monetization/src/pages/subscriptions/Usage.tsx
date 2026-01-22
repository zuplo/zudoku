import { cn } from "zudoku";
import { Button, Heading } from "zudoku/components";
import { useZudoku } from "zudoku/hooks";
import { AlertTriangleIcon, ArrowUpIcon } from "zudoku/icons";
import { useSuspenseQuery } from "zudoku/react-query";
import { Link } from "zudoku/router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card";
import { Progress } from "zudoku/ui/Progress";
import type { Item } from "../../hooks/useSubscriptions";

export type UsageResult = {
  $schema: string;
  customerId: string;
  entitlements: Record<string, Entitlement | MeteredEntitlement>;
  planKey: string;
  subscriptionId: string;
};

export type Entitlement = {
  hasAccess: boolean;
  config?: string;
};

export type MeteredEntitlement = Entitlement & {
  balance: number;
  usage: number;
  overage: number;
};

const isMeteredEntitlement = (
  entitlement: Entitlement | MeteredEntitlement,
): entitlement is MeteredEntitlement => {
  return "balance" in entitlement;
};

const UsageItem = ({
  meter,
  item,
}: {
  meter: MeteredEntitlement;
  item: Item;
}) => {
  return (
    <Card className={cn(meter.overage > 0 && "border-red-400 bg-red-50/50")}>
      <CardHeader className={cn("pb-2")}>
        {meter.overage > 0 && (
          <div className="flex items-start gap-3 p-3 bg-red-100 rounded-lg mb-4">
            <AlertTriangleIcon className="size-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                You've exceeded your monthly quota
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                Additional API calls are being charged at the overage rate
                ($0.03/call). Upgrade to Enterprise for unlimited calls.
              </p>
            </div>

            <Button variant="destructive" size="sm" asChild>
              <Link to="/pricing">
                <ArrowUpIcon />
                Upgrade
              </Link>
            </Button>
          </div>
        )}
        <CardTitle>
          {item.name} {item.price?.amount}
        </CardTitle>
        <CardDescription />
      </CardHeader>
      <CardContent className="pace-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex flex-col gap-2 mb-2">
            <span
              className={cn(meter.overage > 0 && "text-red-600 font-medium")}
            >
              {meter.usage.toLocaleString()} used
              {meter.overage > 0 && (
                <span className="ml-1 text-xs">
                  (+{meter.overage.toLocaleString()} overage)
                </span>
              )}
            </span>
          </div>
          <span className="text-foreground font-medium">
            {meter.balance.toLocaleString()} limit
          </span>
        </div>
        <Progress
          value={(meter.usage / meter.balance) * 100}
          className={cn("mb-3 h-2", meter.overage > 0 && "bg-red-500")}
        />
        <p className="text-xs text-muted-foreground">
          {(meter.balance - meter.usage).toLocaleString()} remaining this month
        </p>
      </CardContent>
    </Card>
  );
};

export const Usage = ({
  subscriptionId,
  environmentName,
  currentItems,
}: {
  subscriptionId: string;
  environmentName: string;
  currentItems: Item[];
}) => {
  const zudoku = useZudoku();
  const { data: usage } = useSuspenseQuery<UsageResult>({
    queryKey: [
      `/v3/zudoku-metering/${environmentName}/subscriptions/${subscriptionId}/usage`,
    ],
    meta: {
      context: zudoku,
    },
  });

  const meteredEntitlements = currentItems.filter(
    (item) => item.included.entitlement?.type === "metered",
  );

  return (
    <div>
      <Heading level={3} className="mb-4">
        Usage
      </Heading>
      {Object.entries(usage.entitlements)
        .filter((entry): entry is [string, MeteredEntitlement] =>
          isMeteredEntitlement(entry[1]),
        )
        .map(([key, metric]) => (
          <UsageItem
            key={key}
            meter={{ ...metric }}
            item={meteredEntitlements.find(
              (item) => item.included.entitlement?.featureKey === key,
            )}
          />
        ))}
    </div>
  );
};
