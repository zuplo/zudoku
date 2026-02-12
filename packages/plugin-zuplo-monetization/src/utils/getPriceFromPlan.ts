import type { FlatFeeRateCard, Plan } from "../types/PlanType";

export const getPriceFromPlan = (plan: Plan) => {
  const defaultPhase = plan.phases.at(-1);
  if (!defaultPhase) return { monthly: 0, yearly: 0 };

  const flatFeeCard = defaultPhase.rateCards.find(
    (rc): rc is FlatFeeRateCard =>
      rc.type === "flat_fee" && rc.price?.type === "flat",
  );

  const monthlyAmount = flatFeeCard?.price.amount
    ? parseInt(flatFeeCard.price.amount, 10)
    : 0;

  return {
    monthly: monthlyAmount,
    yearly: monthlyAmount * 12,
  };
};
