import { useZudoku } from "zudoku/hooks";
import { useSuspenseQuery } from "zudoku/react-query";
import type { Subscription } from "../types/SubscriptionType.js";

export type SubscriptionsResponse = {
  $schema: string;
  items: Array<Subscription>;
  page: number;
  pageSize: number;
  totalCount: number;
};

export const useSubscriptions = (environmentName: string) => {
  const zudoku = useZudoku();
  return useSuspenseQuery<SubscriptionsResponse>({
    queryKey: [`/v3/zudoku-metering/${environmentName}/subscriptions`],
    meta: { context: zudoku },
    select: (data) => ({
      ...data,
      items: [...data.items].sort((a, b) => {
        if (a.status === "active" && b.status !== "active") return -1;
        if (a.status !== "active" && b.status === "active") return 1;
        return 0;
      }),
    }),
  });
};
