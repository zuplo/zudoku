import type { Feature, Quota, RateCard } from "../types/PlanType.js";
import { formatDuration } from "./formatDuration.js";
import { formatPrice } from "./formatPrice.js";
import { formatStaticEntitlementConfig } from "./formatStaticEntitlementConfig.js";
import { formatTieredPriceBreakdown } from "./formatTieredPriceBreakdown.js";

export const categorizeRateCards = (
  rateCards: RateCard[],
  options?: {
    currency?: string;
    units?: Record<string, string>;
    planBillingCadence?: string | null;
  },
) => {
  const { currency, units, planBillingCadence } = options ?? {};
  const quotas: Quota[] = [];
  const features: Feature[] = [];

  for (const rc of rateCards) {
    const et = rc.entitlementTemplate;
    if (!et) continue;

    const unitLabelFor = (rcArg: typeof rc) =>
      units?.[rcArg.key] ?? units?.[rcArg.featureKey ?? ""] ?? "unit";
    // The displayed "X / period" tracks when the quota refills, not when
    // billing happens. Prefer the entitlement's `usagePeriod` (the admin
    // UI's "Quota resets every" field) — it's explicitly independent of
    // billing cadence. Fall back to the rate card or plan billing cadence
    // when no usage period is set.
    const periodFor = (rcArg: typeof rc) => {
      if (et.type === "metered" && et.usagePeriod) {
        return formatDuration(et.usagePeriod);
      }
      if (rcArg.billingCadence) return formatDuration(rcArg.billingCadence);
      if (planBillingCadence) return formatDuration(planBillingCadence);
      return "month";
    };

    // A metered card with `issueAfterReset` represents a "free quota" only
    // when the first tier (matching the issued amount) is truly free —
    // i.e. flat=0 and unit=0. If the first tier has any positive price,
    // the plan is a tiered/graduated pricing schedule and the issued
    // amount is just a tier boundary, not free included usage.
    const firstTier =
      rc.price?.type === "tiered" && rc.price.tiers.length > 0
        ? rc.price.tiers[0]
        : undefined;
    const firstTierIsPriced =
      !!firstTier &&
      (parseFloat(firstTier.flatPrice?.amount ?? "0") > 0 ||
        parseFloat(firstTier.unitPrice?.amount ?? "0") > 0);

    if (
      et.type === "metered" &&
      et.issueAfterReset != null &&
      !firstTierIsPriced
    ) {
      let tierPrices: string[] | undefined;
      if (rc.price?.type === "tiered" && rc.price.tiers) {
        // Build a readable tier breakdown (useful for graduated/volume).
        // The breakdown's "Up to X: Included" line conveys the included
        // quota; the UI hides the separate "X / period" header when this
        // breakdown is present, so the two never duplicate each other.
        tierPrices = formatTieredPriceBreakdown({
          tiers: rc.price.tiers.map((t) => ({
            upToAmount: t.upToAmount,
            unitPriceAmount: t.unitPrice?.amount,
            flatPriceAmount: t.flatPrice?.amount,
          })),
          currency,
          unitLabel: unitLabelFor(rc),
          includedLabel: "Included",
        });
      }
      quotas.push({
        key: rc.featureKey ?? rc.key,
        name: rc.name,
        limit: et.issueAfterReset,
        period: periodFor(rc),
        tierPrices,
      });
    } else if (et.type === "metered" && rc.type === "usage_based" && rc.price) {
      // Pay-as-you-go: usage-based card without a free included quota.
      // Covers true PAYG (no `issueAfterReset`), tiered plans whose first
      // tier carries a non-zero price (the issued amount is a tier boundary,
      // not free included usage), and hard-limit metered cards with a
      // positive price — `isSoftLimit` is a metering concern that doesn't
      // change what the card should display.
      const unitLabel = unitLabelFor(rc);
      if (rc.price.type === "tiered" && rc.price.tiers.length > 0) {
        const tierPrices = formatTieredPriceBreakdown({
          tiers: rc.price.tiers.map((t) => ({
            upToAmount: t.upToAmount,
            unitPriceAmount: t.unitPrice?.amount,
            flatPriceAmount: t.flatPrice?.amount,
          })),
          currency,
          unitLabel,
          includedLabel: "Included",
        });
        quotas.push({
          key: rc.featureKey ?? rc.key,
          name: rc.name,
          limit: 0,
          period: periodFor(rc),
          tierPrices,
          isPayg: true,
        });
      } else if (rc.price.type === "unit" && parseFloat(rc.price.amount) > 0) {
        const amount = parseFloat(rc.price.amount);
        quotas.push({
          key: rc.featureKey ?? rc.key,
          name: rc.name,
          limit: 0,
          period: periodFor(rc),
          unitPrice: `${formatPrice(amount, currency)}/${unitLabel}`,
          isPayg: true,
        });
      } else {
        features.push({ key: rc.featureKey ?? rc.key, name: rc.name });
      }
    } else if (et.type === "boolean") {
      features.push({ key: rc.featureKey ?? rc.key, name: rc.name });
    } else if (et.type === "static" && et.config) {
      features.push({
        key: rc.featureKey ?? rc.key,
        name: rc.name,
        value: formatStaticEntitlementConfig(et.config),
      });
    }
  }

  return { quotas, features };
};
