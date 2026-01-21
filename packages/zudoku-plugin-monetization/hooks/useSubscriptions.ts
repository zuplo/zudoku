import { useAuth, useZudoku } from "zudoku/hooks";
import { useSuspenseQuery } from "zudoku/react-query";

export type SubscriptionsResponse = {
  $schema: string;
  items: Array<{
    activeFrom: string;
    alignment: {
      billablesMustAlign: boolean;
    };
    billingAnchor: string;
    billingCadence: string;
    createdAt: string;
    currency: string;
    customerId: string;
    id: string;
    metadata: any;
    name: string;
    plan: {
      id: string;
      key: string;
      version: number;
    };
    proRatingConfig: {
      enabled: boolean;
      mode: string;
    };
    status: string;
    updatedAt: string;
    consumer: {
      id: string;
      name: string;
      createdOn: string;
      updatedOn: string;
      tags: {};
      metadata: {};
      apiKeys: Array<{
        id: string;
        createdOn: string;
        updatedOn: string;
        key: string;
      }>;
      managers: Array<{
        id: string;
        email: string;
        sub: string;
        createdOn: string;
      }>;
    };
  }>;
  page: number;
  pageSize: number;
  totalCount: number;
};

export const useSubscriptions = (environmentName: string) => {
  const zudoku = useZudoku();
  return useSuspenseQuery<SubscriptionsResponse>({
    meta: {
      context: zudoku,
    },
    queryKey: [`/v3/zudoku-metering/${environmentName}/subscriptions`],
  });
};
