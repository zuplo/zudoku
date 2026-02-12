import type { Feature, Quota, RateCard } from "../types/PlanType";
import { formatDuration } from "./formatDuration";

export const categorizeRateCards = (rateCards: RateCard[]) => {
  const quotas: Quota[] = [];
  const features: Feature[] = [];

  for (const rc of rateCards) {
    const et = rc.entitlementTemplate;
    if (!et) continue;

    if (et.type === "metered" && et.issueAfterReset != null) {
      let overagePrice: string | undefined;
      if (rc.price?.type === "tiered" && rc.price.tiers) {
        const overageTier = rc.price.tiers.find((t) => t.unitPrice?.amount);
        if (overageTier?.unitPrice) {
          const amount = parseFloat(overageTier.unitPrice.amount);
          overagePrice = `$${amount.toFixed(2)}/unit`;
        }
      }
      quotas.push({
        key: rc.featureKey,
        name: rc.name,
        limit: et.issueAfterReset,
        period: et.usagePeriod ? formatDuration(et.usagePeriod) : "Month",
        overagePrice,
      });
    } else if (et.type === "boolean") {
      features.push({ key: rc.featureKey, name: rc.name });
    } else if (et.type === "static" && et.config) {
      try {
        const config = JSON.parse(et.config);
        features.push({
          key: rc.featureKey,
          name: rc.name,
          value: String(config.value),
        });
      } catch {
        features.push({ key: rc.featureKey, name: rc.name });
      }
    }
  }

  return { quotas, features };
};
