import type { Plan, RateCard } from "../types/PlanType.js";

export const sumFlatFeeAmounts = (rateCards: RateCard[]): number => {
  let total = 0;
  for (const rc of rateCards) {
    // Only recurring flat fees contribute to the headline. A `flat_fee` rate
    // card with `billingCadence: null` is a one-time charge (e.g. a setup
    // fee) and must not be shown as part of the recurring price.
    if (rc.type === "flat_fee" && rc.price && rc.billingCadence !== null) {
      const amount = Number(rc.price.amount);
      if (Number.isFinite(amount)) total += amount;
    }
  }
  return total;
};

/**
 * The billing cadence to pair with a phase's flat-fee price: the cadence of
 * the FIRST recurring flat-fee rate card — the same cards
 * {@link sumFlatFeeAmounts} totals. Returns `undefined` when the phase has no
 * recurring flat fee (a free or pay-as-you-go phase), where no `/cadence`
 * suffix is rendered anyway.
 *
 * This is the phase's OWN cadence, which can differ from the plan's
 * `billingCadence` (e.g. an hourly `PT1H` trial inside a daily `P1D` plan).
 * Pairing the amount with the rate card's cadence keeps the suffix truthful
 * instead of borrowing the plan-level cadence.
 *
 * When a phase has several recurring flat fees on different cadences, the
 * summed amount is shown against this first card's cadence — a deliberate
 * simplification, since one suffix can't represent mixed cadences.
 */
export const getFlatFeeBillingCadence = (
  rateCards: RateCard[],
): string | undefined => {
  for (const rc of rateCards) {
    if (rc.type === "flat_fee" && rc.price && rc.billingCadence !== null) {
      return rc.billingCadence;
    }
  }
  return undefined;
};

/**
 * The plan's headline recurring price: the sum of every recurring `flat_fee`
 * rate-card amount on the plan's steady-state (last) phase, expressed in the
 * plan's own `billingCadence`. One-time fees (`flat_fee` with
 * `billingCadence: null`, e.g. a setup fee) are excluded.
 *
 * This is derived entirely from the plan's rate cards. It deliberately does
 * NOT read any server-provided `monthlyPrice` / `yearlyPrice` and performs no
 * cadence conversion, so it stays correct for any billing cadence — hourly
 * (`PT1H`), weekly, monthly, yearly, etc. Callers pair the returned amount
 * with `formatDuration(plan.billingCadence)` to render e.g. `$2.99/hour`.
 *
 * Returns `0` when there are no phases or no recurring flat fee, which callers
 * render as "Free" (or "Pay as you go" when the plan bills on usage — see
 * {@link formatPlanPrice}).
 */
export const getPlanPrice = (plan: Plan): number => {
  const lastPhase = plan.phases?.at(-1);
  if (!lastPhase) return 0;
  return sumFlatFeeAmounts(lastPhase.rateCards ?? []);
};
