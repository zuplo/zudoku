import type { Feature, Quota, RateCard } from "../types/PlanType.js";
import { formatDuration } from "./formatDuration.js";
import { formatPrice } from "./formatPrice.js";
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

    if (et.type === "metered" && et.issueAfterReset != null) {
      let overagePrice: string | undefined;
      let tierPrices: string[] | undefined;
      if (rc.price?.type === "tiered" && rc.price.tiers) {
        const unitLabel =
          units?.[rc.key] ?? units?.[rc.featureKey ?? ""] ?? "unit";

        // Build a readable tier breakdown (useful for graduated/volume).
        tierPrices = formatTieredPriceBreakdown({
          tiers: rc.price.tiers.map((t) => ({
            upToAmount: t.upToAmount,
            unitPriceAmount: t.unitPrice?.amount,
            flatPriceAmount: t.flatPrice?.amount,
          })),
          currency,
          unitLabel,
          includedLabel: "Included",
          omitIncludedUpToAmount: et.issueAfterReset,
        });

        const overageTier = rc.price.tiers.find(
          (t) => t.unitPrice?.amount && parseFloat(t.unitPrice.amount) > 0,
        );
        if (et.isSoftLimit !== false && overageTier?.unitPrice) {
          const amount = parseFloat(overageTier.unitPrice.amount);
          overagePrice = `${formatPrice(amount, currency)}/${unitLabel}`;
        }
      }
      quotas.push({
        key: rc.featureKey ?? rc.key,
        name: rc.name,
        limit: et.issueAfterReset,
        period: rc.billingCadence
          ? formatDuration(rc.billingCadence)
          : planBillingCadence
            ? formatDuration(planBillingCadence)
            : "month",
        overagePrice,
        tierPrices,
      });
    } else if (et.type === "boolean") {
      features.push({ key: rc.featureKey ?? rc.key, name: rc.name });
    } else if (et.type === "static" && et.config) {
      try {
        const config = JSON.parse(et.config);
        features.push({
          key: rc.featureKey ?? rc.key,
          name: rc.name,
          value: String(config.value),
        });
      } catch {
        features.push({ key: rc.featureKey ?? rc.key, name: rc.name });
      }
    }
  }

  return { quotas, features };
};
