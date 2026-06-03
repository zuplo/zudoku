import type { Plan, RateCard } from "../types/PlanType.js";
import { getPlanPrice } from "./getPlanPrice.js";
import { tierHasPositivePrice } from "./tierHasPositivePrice.js";

export type PlanPriceLabel =
  | { type: "free" }
  | { type: "payg"; main: "Pay as you go"; sub: "Usage-based pricing" }
  // `amount` is the recurring price in the plan's own `billingCadence`
  // (render alongside `formatDuration(plan.billingCadence)`).
  | { type: "priced"; amount: number };

// A `usage_based` rate card is only evidence of usage-based billing when it
// actually has a non-zero price. `price: null` (used elsewhere in this repo
// for free, quota-only metered entitlements) and all-zero tiered schedules
// don't bill anything per unit and shouldn't flip a plan into PAYG.
const isPricedUsageRateCard = (rc: RateCard): boolean => {
  if (rc.type !== "usage_based" || !rc.price) return false;
  const p = rc.price;
  if (p.type === "unit") return parseFloat(p.amount) > 0;
  if (p.type === "tiered") {
    return p.tiers.some(tierHasPositivePrice);
  }
  // Other shapes (flat / dynamic / package) on usage_based are uncommon
  // but imply some form of billing — treat as priced.
  return true;
};

const hasPricedUsageRateCard = (plan: Plan) =>
  plan.phases.some((phase) => phase.rateCards.some(isPricedUsageRateCard));

/**
 * Headline pricing for plan cards. Centralizes the "Pay as you go" detection:
 * plans whose flat-fee total is zero but that bill on usage shouldn't render
 * as "Free" - they're charged per-unit.
 */
export const formatPlanPrice = (plan: Plan): PlanPriceLabel => {
  // Subscription-embedded plans can arrive without phases populated; treat a
  // missing/empty phase list as "free" rather than dereferencing it.
  if (!plan.phases || plan.phases.length === 0) return { type: "free" };

  const amount = getPlanPrice(plan);

  if (amount > 0) {
    return { type: "priced", amount };
  }

  if (hasPricedUsageRateCard(plan)) {
    return { type: "payg", main: "Pay as you go", sub: "Usage-based pricing" };
  }

  return { type: "free" };
};
