import { useZudoku } from "zudoku/hooks";
import { useSuspenseQuery } from "zudoku/react-query";

export type Item = {
  activeFrom: string;
  activeTo?: string;
  billingCadence?: string;
  createdAt: string;
  featureKey: string;
  id: string;
  included: {
    entitlement?: {
      activeFrom: string;
      activeTo?: string;
      annotations: {
        "subscription.id": string;
      };
      createdAt: string;
      currentUsagePeriod?: {
        from: string;
        to: string;
      };
      featureId: string;
      featureKey: string;
      id: string;
      isSoftLimit?: boolean;
      isUnlimited?: boolean;
      issueAfterReset?: number;
      lastReset?: string;
      measureUsageFrom?: string;
      preserveOverageAtReset?: boolean;
      subjectKey: string;
      type: string;
      updatedAt: string;
      usagePeriod?: {
        anchor: string;
        interval: string;
        intervalISO: string;
      };
      config?: string;
    };
    feature: {
      createdAt: string;
      id: string;
      key: string;
      meterSlug?: string;
      name: string;
      updatedAt: string;
    };
  };
  key: string;
  metadata: any;
  name: string;
  price?: {
    mode?: string;
    tiers?: Array<{
      flatPrice: {
        amount: string;
        type: string;
      };
      unitPrice?: {
        amount: string;
        type: string;
      };
      upToAmount?: string;
    }>;
    type: string;
    amount?: string;
    paymentTerm?: string;
  };
  updatedAt: string;
  taxConfig?: {};
};

export type SubscriptionsResponse = {
  $schema: string;
  items: Array<{
    activeFrom: string;
    alignment: {
      billablesMustAlign: boolean;
      currentAlignedBillingPeriod: {
        from: string;
        to: string;
      };
    };
    billingAnchor: string;
    billingCadence: string;
    createdAt: string;
    currency: string;
    customerId: string;
    id: string;
    metadata: any;
    name: string;
    phases: Array<{
      activeFrom: string;
      activeTo?: string;
      createdAt: string;
      description?: string;
      id: string;
      itemTimelines: {
        api: Array<{
          activeFrom: string;
          activeTo?: string;
          billingCadence?: string;
          createdAt: string;
          featureKey: string;
          id: string;
          included: {
            entitlement: {
              activeFrom: string;
              activeTo?: string;
              annotations: {
                "subscription.id": string;
              };
              createdAt: string;
              currentUsagePeriod: {
                from: string;
                to: string;
              };
              featureId: string;
              featureKey: string;
              id: string;
              isSoftLimit: boolean;
              isUnlimited: boolean;
              issueAfterReset: number;
              lastReset: string;
              measureUsageFrom: string;
              preserveOverageAtReset: boolean;
              subjectKey: string;
              type: string;
              updatedAt: string;
              usagePeriod: {
                anchor: string;
                interval: string;
                intervalISO: string;
              };
            };
            feature: {
              createdAt: string;
              id: string;
              key: string;
              meterSlug: string;
              name: string;
              updatedAt: string;
            };
          };
          key: string;
          metadata: any;
          name: string;
          price?: {
            mode: string;
            tiers: Array<{
              flatPrice: {
                amount: string;
                type: string;
              };
              unitPrice?: {
                amount: string;
                type: string;
              };
              upToAmount?: string;
            }>;
            type: string;
          };
          updatedAt: string;
          taxConfig?: {};
        }>;
        attribution: Array<{
          activeFrom: string;
          activeTo?: string;
          billingCadence: any;
          createdAt: string;
          featureKey: string;
          id: string;
          included: {
            entitlement: {
              activeFrom: string;
              activeTo?: string;
              annotations: {
                "subscription.id": string;
              };
              config: string;
              createdAt: string;
              featureId: string;
              featureKey: string;
              id: string;
              subjectKey: string;
              type: string;
              updatedAt: string;
            };
            feature: {
              createdAt: string;
              id: string;
              key: string;
              name: string;
              updatedAt: string;
            };
          };
          key: string;
          metadata: any;
          name: string;
          price: any;
          updatedAt: string;
        }>;
        commercial: Array<{
          activeFrom: string;
          activeTo?: string;
          billingCadence: any;
          createdAt: string;
          featureKey: string;
          id: string;
          included: {
            entitlement: {
              activeFrom: string;
              activeTo?: string;
              annotations: {
                "subscription.id": string;
              };
              config: string;
              createdAt: string;
              featureId: string;
              featureKey: string;
              id: string;
              subjectKey: string;
              type: string;
              updatedAt: string;
            };
            feature: {
              createdAt: string;
              id: string;
              key: string;
              name: string;
              updatedAt: string;
            };
          };
          key: string;
          metadata: any;
          name: string;
          price: any;
          updatedAt: string;
        }>;
        data_timeframe: Array<{
          activeFrom: string;
          activeTo?: string;
          billingCadence?: string;
          createdAt: string;
          featureKey: string;
          id: string;
          included: {
            entitlement: {
              activeFrom: string;
              activeTo?: string;
              annotations: {
                "subscription.id": string;
              };
              config: string;
              createdAt: string;
              featureId: string;
              featureKey: string;
              id: string;
              subjectKey: string;
              type: string;
              updatedAt: string;
            };
            feature: {
              createdAt: string;
              id: string;
              key: string;
              name: string;
              updatedAt: string;
            };
          };
          key: string;
          metadata: any;
          name: string;
          price: any;
          updatedAt: string;
          taxConfig?: {};
        }>;
        event_venue_details: Array<{
          activeFrom: string;
          activeTo?: string;
          billingCadence: any;
          createdAt: string;
          featureKey: string;
          id: string;
          included: {
            entitlement: {
              activeFrom: string;
              activeTo?: string;
              annotations: {
                "subscription.id": string;
              };
              config: string;
              createdAt: string;
              featureId: string;
              featureKey: string;
              id: string;
              subjectKey: string;
              type: string;
              updatedAt: string;
            };
            feature: {
              createdAt: string;
              id: string;
              key: string;
              name: string;
              updatedAt: string;
            };
          };
          key: string;
          metadata: any;
          name: string;
          price: any;
          updatedAt: string;
        }>;
        external_ids: Array<{
          activeFrom: string;
          activeTo?: string;
          billingCadence: any;
          createdAt: string;
          featureKey: string;
          id: string;
          included: {
            entitlement: {
              activeFrom: string;
              activeTo?: string;
              annotations: {
                "subscription.id": string;
              };
              config: string;
              createdAt: string;
              featureId: string;
              featureKey: string;
              id: string;
              subjectKey: string;
              type: string;
              updatedAt: string;
            };
            feature: {
              createdAt: string;
              id: string;
              key: string;
              name: string;
              updatedAt: string;
            };
          };
          key: string;
          metadata: any;
          name: string;
          price: any;
          updatedAt: string;
        }>;
        geography: Array<{
          activeFrom: string;
          activeTo?: string;
          billingCadence: any;
          createdAt: string;
          featureKey: string;
          id: string;
          included: {
            entitlement: {
              activeFrom: string;
              activeTo?: string;
              annotations: {
                "subscription.id": string;
              };
              config: string;
              createdAt: string;
              featureId: string;
              featureKey: string;
              id: string;
              subjectKey: string;
              type: string;
              updatedAt: string;
            };
            feature: {
              createdAt: string;
              id: string;
              key: string;
              name: string;
              updatedAt: string;
            };
          };
          key: string;
          metadata: any;
          name: string;
          price: any;
          updatedAt: string;
        }>;
        historical: Array<{
          activeFrom: string;
          activeTo?: string;
          billingCadence: any;
          createdAt: string;
          featureKey: string;
          id: string;
          included: {
            entitlement: {
              activeFrom: string;
              activeTo?: string;
              annotations: {
                "subscription.id": string;
              };
              config: string;
              createdAt: string;
              featureId: string;
              featureKey: string;
              id: string;
              subjectKey: string;
              type: string;
              updatedAt: string;
            };
            feature: {
              createdAt: string;
              id: string;
              key: string;
              name: string;
              updatedAt: string;
            };
          };
          key: string;
          metadata: any;
          name: string;
          price: any;
          updatedAt: string;
        }>;
        api_quota?: Array<{
          activeFrom: string;
          billingCadence: string;
          createdAt: string;
          featureKey: string;
          id: string;
          included: {
            feature: {
              createdAt: string;
              id: string;
              key: string;
              name: string;
              updatedAt: string;
            };
          };
          key: string;
          metadata: any;
          name: string;
          price: {
            amount: string;
            paymentTerm: string;
            type: string;
          };
          taxConfig: {};
          updatedAt: string;
        }>;
      };
      items: Array<Item>;
      key: string;
      metadata: any;
      name: string;
      updatedAt: string;
    }>;
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
        expiresOn?: string;
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
