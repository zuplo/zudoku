import type { Plan, RateCard } from "../types/PlanType.js";

const sumFlatFeeAmounts = (rateCards: RateCard[]): number => {
  let total = 0;
  for (const rc of rateCards) {
    if (rc.type === "flat_fee" && rc.price) {
      const amount = Number(rc.price.amount);
      if (Number.isFinite(amount)) total += amount;
    }
  }
  return total;
};

/**
 * The plan's headline recurring price: the sum of every `flat_fee` rate-card
 * amount on the plan's steady-state (last) phase, expressed in the plan's own
 * `billingCadence`.
 *
 * This is derived entirely from the plan's rate cards. It deliberately does
 * NOT read any server-provided `monthlyPrice` / `yearlyPrice` and performs no
 * cadence conversion, so it stays correct for any billing cadence — hourly
 * (`PT1H`), weekly, monthly, yearly, etc. Callers pair the returned amount
 * with `formatDuration(plan.billingCadence)` to render e.g. `$2.99/hour`.
 *
 * Returns `0` when there are no phases or no flat fee, which callers render as
 * "Free" (or "Pay as you go" when the plan bills on usage — see
 * {@link formatPlanPrice}).
 */
export const getPlanPrice = (plan: Plan): number => {
  const lastPhase = plan.phases?.at(-1);
  if (!lastPhase) return 0;
  return sumFlatFeeAmounts(lastPhase.rateCards ?? []);
};
