import { Heading } from "zudoku/components";
import { useZudoku } from "zudoku/hooks";
import { useSuspenseQuery } from "zudoku/react-query";
import { Card, CardContent } from "zudoku/ui/Card";
import { Progress } from "zudoku/ui/Progress";

import { usePlans } from "../../hooks/usePlans";

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

export const Usage = ({
  subscriptionId,
  environmentName,
}: {
  subscriptionId: string;
  environmentName: string;
}) => {
  const zudoku = useZudoku();
  const { data: plans } = usePlans(environmentName);

  const { data: usage } = useSuspenseQuery<UsageResult>({
    queryKey: [
      `/v3/zudoku-metering/${environmentName}/subscriptions/${subscriptionId}/usage`,
    ],
    meta: {
      context: zudoku,
    },
  });

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
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex flex-col gap-2">
                      <span className="text-base font-medium capitalize">
                        {key}
                      </span>
                      <span className="text-muted-foreground">
                        {metric.usage.toLocaleString()} used
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {metric.balance.toLocaleString()} limit
                    </span>
                  </div>
                  <Progress
                    value={(metric.usage / metric.balance) * 100}
                    className="h-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    {metric.balance - metric.usage} calls remaining this month
                  </p>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
};
