import type { PlanPhase } from "../types/PlanType.js";
import {
  isPricedUsageRateCard,
  type PlanPriceLabel,
} from "./formatPlanPrice.js";
import { sumFlatFeeAmounts } from "./getPlanPrice.js";

/**
 * Headline price for a SINGLE phase, derived only from that phase's own rate
 * cards. Mirrors {@link formatPlanPrice}'s rules, but scoped to the phase:
 * a positive recurring flat-fee total is `priced`; otherwise a priced
 * `usage_based` card in this phase makes it `payg`; otherwise it's `free`.
 *
 * Like {@link getPlanPrice}, one-time fees (`flat_fee` with
 * `billingCadence: null`) and `price: null` rate cards contribute nothing —
 * an intro phase whose fees all have `price: null` derives as `free`.
 */
export const getPhasePriceLabel = (phase: PlanPhase): PlanPriceLabel => {
  const rateCards = phase.rateCards ?? [];
  const amount = sumFlatFeeAmounts(rateCards);

  if (amount > 0) {
    return { type: "priced", amount };
  }

  if (rateCards.some(isPricedUsageRateCard)) {
    return { type: "payg", main: "Pay as you go", sub: "Usage-based pricing" };
  }

  return { type: "free" };
};
