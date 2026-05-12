// Pure presentational components. No dependency on zudoku runtime — safe to
// consume from any React app that has Tailwind, lucide-react, clsx, and
// tailwind-merge available.
export { FeatureItem } from "./FeatureItem.js";
export { PlanEntitlements } from "./PlanEntitlements.js";
export { PricingCard, type PricingCardProps } from "./PricingCard.js";
export { PricingTable, type PricingTableProps } from "./PricingTable.js";
export { QuotaItem } from "./QuotaItem.js";

// Pricing data types
export type {
  Alignment,
  BooleanEntitlementTemplate,
  DynamicPrice,
  EntitlementTemplate,
  Feature,
  FlatFeeRateCard,
  FlatPrice,
  MeteredEntitlementTemplate,
  PackagePrice,
  Plan,
  PlanDefaultTaxConfig,
  PlanPhase,
  Price,
  PriceTier,
  ProRatingConfig,
  Quota,
  RateCard,
  StaticEntitlementTemplate,
  TieredPrice,
  UnitPrice,
  UsageBasedRateCard,
  ValidationError,
} from "../types/PlanType.js";

// Pure utilities used to build / format pricing data
export { categorizeRateCards } from "../utils/categorizeRateCards.js";
export {
  formatDuration,
  formatDurationAdjective,
  formatDurationInterval,
} from "../utils/formatDuration.js";
export {
  formatMinorCurrencyAmount,
  formatPrice,
} from "../utils/formatPrice.js";
export { formatStaticEntitlementConfig } from "../utils/formatStaticEntitlementConfig.js";
export {
  formatTieredPriceBreakdown,
  type TieredPriceBreakdownTier,
} from "../utils/formatTieredPriceBreakdown.js";
export { getPriceFromPlan } from "../utils/getPriceFromPlan.js";
export {
  collectDefaultTaxBehaviors,
  planHasDefaultTaxBehavior,
  subscriptionTaxLegendSentence,
  taxBehaviorLegendSentence,
} from "../utils/pricingTaxLegend.js";
