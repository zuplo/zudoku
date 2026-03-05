import type { Feature, Quota, RateCard } from "../types/PlanType.js";
import { formatDuration } from "./formatDuration.js";
import { formatPrice } from "./formatPrice.js";

export const categorizeRateCards = (
  rateCards: RateCard[],
  currency?: string,
) => {
  const quotas: Quota[] = [];
  const features: Feature[] = [];

  for (const rc of rateCards) {
    const et = rc.entitlementTemplate;
    if (!et) continue;

    if (et.type === "metered" && et.issueAfterReset != null) {
      let overagePrice: string | undefined;
      if (
        et.isSoftLimit !== false &&
        rc.price?.type === "tiered" &&
        rc.price.tiers
      ) {
        const overageTier = rc.price.tiers.find((t) => t.unitPrice?.amount);
        if (overageTier?.unitPrice) {
          const amount = parseFloat(overageTier.unitPrice.amount);
          overagePrice = `${formatPrice(amount, currency)}/unit`;
        }
      }
      quotas.push({
        key: rc.featureKey ?? rc.key,
        name: rc.name,
        limit: et.issueAfterReset,
        period: et.usagePeriod ? formatDuration(et.usagePeriod) : "Month",
        overagePrice,
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
