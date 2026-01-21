export type EntitlementTemplate =
  | MeteredEntitlementTemplate
  | StaticEntitlementTemplate
  | BooleanEntitlementTemplate;

export interface MeteredEntitlementTemplate {
  type: "metered";
  isSoftLimit?: boolean;
  issueAfterReset?: number;
  issueAfterResetPriority?: number; // 1-255
  preserveOverageAtReset?: boolean;
  usagePeriod?: string; // ISO 8601 duration, defaults to rate card's billing cadence
}

export interface StaticEntitlementTemplate {
  type: "static";
  config: string; // JSON parsable config object
}

export interface BooleanEntitlementTemplate {
  type: "boolean";
}

export interface PriceTier {
  flatPrice?: { amount: string };
  unitPrice?: { amount: string };
  upToAmount?: string;
}

export type Price =
  | FlatPrice
  | UnitPrice
  | TieredPrice
  | DynamicPrice
  | PackagePrice;

export interface FlatPrice {
  type: "flat";
  amount: string; // Money (numeric string)
  paymentTerm?: "in_advance" | "in_arrears"; // Defaults to in_advance
}

export interface UnitPrice {
  type: "unit";
  amount: string; // Money
}

export interface TieredPrice {
  type: "tiered";
  mode: "volume" | "graduated";
  tiers: PriceTier[]; // Min 1 tier required
}

export interface DynamicPrice {
  type: "dynamic";
  multiplier?: string; // Numeric string, defaults to "1"
}

export interface PackagePrice {
  type: "package";
  amount: string;
  quantityPerPackage: string;
  minimumAmount?: string;
  maximumAmount?: string;
}
export type RateCard = FlatFeeRateCard | UsageBasedRateCard;

interface RateCardBase {
  key: string;
  name: string;
  description?: string;
  metadata?: Record<string, any> | null;
  featureKey?: string;
  entitlementTemplate?: EntitlementTemplate;
}

export interface UsageBasedRateCard extends RateCardBase {
  type: "usage_based";
  billingCadence: string; // ISO 8601 duration
  price: Price | null; // Can be flat, unit, tiered, dynamic, or package
}

export interface FlatFeeRateCard extends RateCardBase {
  type: "flat_fee";
  billingCadence: string | null; // ISO 8601 duration, null = one-time fee
  price: FlatPrice | null; // null = free
}

export interface PlanPhase {
  key: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  duration?: string | null;
  rateCards: RateCard[];
}

export interface Quota {
  key: string;
  name: string;
  limit: number;
  period: string;
  overagePrice?: string;
}

export interface Feature {
  key: string;
  name: string;
  value?: string;
}

export interface Alignment {
  billablesMustAlign?: boolean;
}

export interface ProRatingConfig {
  enabled: boolean; // defaults to true
  mode: "prorate_prices" | "prorate_quantities"; // defaults to "prorate_prices"
}

export interface ValidationError {
  message: string;
  path?: string;
  code?: string;
}

export interface Plan {
  id: string;
  key: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  version?: number; // defaults to 1
  currency?: string;
  billingCadence: string;
  status?: "draft" | "active" | "archived" | "scheduled";
  effectiveFrom?: string;
  effectiveTo?: string;
  alignment?: Alignment;
  proRatingConfig?: ProRatingConfig;
  validationErrors?: ValidationError[] | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  phases: PlanPhase[];
}
