import type { Plan } from "./PlanType.js";

/** Plan object embedded on a subscription from `/subscriptions` (metering API). */
export type SubscriptionPlan = Plan & {
  paymentMethodRequired?: boolean;
};

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
  metadata: Record<string, string>;
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
  taxConfig?: Record<string, unknown>;
};

export type ItemTimeline = {
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
  metadata: Record<string, string>;
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
  taxConfig?: Record<string, unknown>;
};

export type Subscription = {
  annotations?: {
    "subscription.previous.id"?: string;
  };
  activeFrom: string;
  activeTo?: string;
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
  metadata: Record<string, string>;
  name: string;
  phases: Array<{
    activeFrom: string;
    activeTo?: string;
    createdAt: string;
    description?: string;
    id: string;
    itemTimelines: Record<string, ItemTimeline>;
    items: Array<Item>;
    key: string;
    metadata: Record<string, string>;
    name: string;
    updatedAt: string;
  }>;
  plan: SubscriptionPlan;
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
    tags: Record<string, string>;
    metadata: Record<string, string>;
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
};
