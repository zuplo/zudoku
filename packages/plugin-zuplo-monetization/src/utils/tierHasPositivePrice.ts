import type { PriceTier } from "../types/PlanType.js";

/**
 * Whether a price tier charges anything — a non-zero flat or per-unit amount.
 * Amounts are decimal strings and a missing part counts as zero, so this
 * distinguishes a genuinely priced tier from an all-zero ("Included") tier.
 * Shared by the pricing-label path ({@link formatPlanPrice}) and rate-card
 * categorization ({@link categorizeRateCards}) so both decide "is this tier
 * free?" the same way.
 */
export const tierHasPositivePrice = (tier: PriceTier): boolean =>
  parseFloat(tier.flatPrice?.amount ?? "0") > 0 ||
  parseFloat(tier.unitPrice?.amount ?? "0") > 0;
