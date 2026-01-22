import { Heading } from "zudoku/components";
import { useZudoku } from "zudoku/hooks";
import { useSuspenseQuery } from "zudoku/react-query";
import { Card, CardContent } from "zudoku/ui/Card";
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
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex flex-col gap-2">
          <span className="text-base font-medium capitalize">{item.name}</span>
          <span className="text-muted-foreground">
            {meter.usage.toLocaleString()} used
          </span>
        </div>
        <span className="text-muted-foreground">
          {meter.balance.toLocaleString()} limit
        </span>
      </div>
      <Progress value={(meter.usage / meter.balance) * 100} className="h-2" />
      <p className="text-sm text-muted-foreground">
        {(meter.balance - meter.usage).toLocaleString()} remaining this month
      </p>
    </div>
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
      <Card>
        <CardContent className="p-6">
          {Object.entries(usage.entitlements)
            .filter((entry): entry is [string, MeteredEntitlement] =>
              isMeteredEntitlement(entry[1]),
            )
            .map(([key, metric], index) => (
              <div key={key}>
                {index > 0 && <div className="my-4 border-t" />}
                <UsageItem
                  meter={metric}
                  item={meteredEntitlements.find(
                    (item) => item.included.entitlement?.featureKey === key,
                  )}
                />
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
};
