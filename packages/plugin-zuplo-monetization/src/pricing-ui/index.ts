// Pure presentational components. No dependency on the zudoku runtime — safe
// to consume from any React app.
//
// Consumer requirements:
//   - React 19+ and react-dom (peer dep)
//   - Tailwind CSS configured with shadcn/ui design tokens. The components
//     use the following classes, which assume the matching CSS variables
//     are defined (e.g. `--primary`, `--primary-foreground`, `--border`,
//     `--muted-foreground`, `--card-foreground`):
//       text-primary, bg-primary, border-primary, text-primary-foreground,
//       text-muted-foreground, text-card-foreground, border-border
//     The easiest way to satisfy this is the standard shadcn/ui Tailwind
//     setup (https://ui.shadcn.com/docs/installation). The CTA `Button`
//     passed via `renderAction` is also typically the shadcn/ui `Button`.
//   - No icon library required — the single `CheckIcon` used by
//     `FeatureItem` / `QuotaItem` is bundled as an inline SVG.
//   - The CTA element rendered for each card is supplied by the consumer
//     via `renderAction(plan, isPopular)` on `<PricingTable>` — pricing-ui
//     does not bundle any button or router/link component.
//   - For more advanced per-card customization (e.g. wrapping each card
//     with drag handles, popovers, overlays), use `renderCard(plan, ctx)`
//     where `ctx.defaultCard` is the standard card element. To opt out of
//     the wrapper entirely, render `<PricingCard>` yourself in a custom
//     grid.
export { FeatureItem } from "./FeatureItem.js";
export { PlanEntitlements } from "./PlanEntitlements.js";
export { PlanPriceSchedule } from "./PlanPriceSchedule.js";
export { PlanPriceTag } from "./PlanPriceTag.js";
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
  formatPlanPrice,
  type PlanPriceLabel,
} from "../utils/formatPlanPrice.js";
export {
  formatMinorCurrencyAmount,
  formatPrice,
} from "../utils/formatPrice.js";
export { formatStaticEntitlementConfig } from "../utils/formatStaticEntitlementConfig.js";
export {
  formatTieredPriceBreakdown,
  type TieredPriceBreakdownTier,
} from "../utils/formatTieredPriceBreakdown.js";
export { getPhasePriceLabel } from "../utils/getPhasePriceLabel.js";
export { getPlanPrice } from "../utils/getPlanPrice.js";
export {
  getPlanPriceSchedule,
  type PlanPriceScheduleRow,
} from "../utils/getPlanPriceSchedule.js";
export {
  collectDefaultTaxBehaviors,
  planHasDefaultTaxBehavior,
  subscriptionTaxLegendSentence,
  taxBehaviorLegendSentence,
} from "../utils/pricingTaxLegend.js";
