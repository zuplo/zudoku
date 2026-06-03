import { parse } from "tinyduration";
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
 * Convert an ISO 8601 duration to an approximate number of months.
 * Years and months contribute exactly; weeks use 12/52 months/week and
 * days use 1/30 months/day. Sub-day units (hours, minutes, seconds) do
 * not contribute and a duration consisting only of those returns
 * `undefined` because there is no sensible monthly equivalent.
 */
const cadenceToMonths = (iso: string): number | undefined => {
  try {
    const d = parse(iso);
    let months = 0;
    if (d.years) months += d.years * 12;
    if (d.months) months += d.months;
    if (d.weeks) months += d.weeks * (12 / 52);
    if (d.days) months += d.days * (1 / 30);
    return months > 0 ? months : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Derive a (monthly, yearly) headline price from a plan's last phase by
 * summing all `flat_fee` rate-card amounts and converting from the plan's
 * `billingCadence` to a monthly equivalent.
 *
 * Returns `null` for either field when no value can be derived (no
 * phases, or an unparseable / sub-day cadence). A flat-fee sum of 0
 * returns `{ monthly: 0, yearly: 0 }` (Free).
 *
 * Useful for consumers whose source data doesn't already include
 * pre-computed `monthlyPrice` / `yearlyPrice` — pass the result through
 * (or rely on `getPriceFromPlan`'s built-in fallback).
 */
export const derivePriceFromPlan = (
  plan: Plan,
): { monthly: number | null; yearly: number | null } => {
  const lastPhase = plan.phases?.at(-1);
  if (!lastPhase) return { monthly: null, yearly: null };

  const flatPrice = sumFlatFeeAmounts(lastPhase.rateCards ?? []);
  if (flatPrice === 0) return { monthly: 0, yearly: 0 };

  const months = cadenceToMonths(plan.billingCadence);
  if (months == null) return { monthly: null, yearly: null };

  const monthly = flatPrice / months;
  return { monthly, yearly: monthly * 12 };
};

/**
 * Returns the monthly and yearly headline price for a plan, always derived
 * from the plan's rate cards via {@link derivePriceFromPlan}.
 *
 * The server may also send pre-computed `monthlyPrice` / `yearlyPrice` on the
 * plan, but we deliberately ignore them and derive client-side so the headline
 * is computed the same way everywhere it's shown. In particular the admin
 * preview (Zuplo portal) builds plans from an API that carries no aggregate,
 * so it can only derive — deriving here too keeps the two surfaces identical
 * and avoids drift when the server aggregate disagrees with the rate cards.
 * Values that can't be resolved are reported as `0`, which renders as "Free".
 */
export const getPriceFromPlan = (plan: Plan) => {
  const derived = derivePriceFromPlan(plan);
  return {
    monthly: derived.monthly ?? 0,
    yearly: derived.yearly ?? 0,
  };
};
