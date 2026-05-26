import type { Plan } from "../types/PlanType.js";
import { getPriceFromPlan } from "./getPriceFromPlan.js";

export type PlanPriceLabel =
  | { type: "free" }
  | { type: "payg"; main: "Pay as you go"; sub: "Usage-based pricing" }
  | { type: "priced"; monthly: number; yearly: number };

const hasUsageRateCard = (plan: Plan) =>
  plan.phases.some((phase) =>
    phase.rateCards.some((rc) => rc.type === "usage_based"),
  );

/**
 * Headline pricing for plan cards. Centralizes the "Pay as you go" detection:
 * plans whose flat-fee total is zero but that bill on usage shouldn't render
 * as "Free" - they're charged per-unit.
 */
export const formatPlanPrice = (plan: Plan): PlanPriceLabel => {
  if (plan.phases.length === 0) return { type: "free" };

  const { monthly, yearly } = getPriceFromPlan(plan);

  if (monthly > 0) {
    return { type: "priced", monthly, yearly };
  }

  if (hasUsageRateCard(plan)) {
    return { type: "payg", main: "Pay as you go", sub: "Usage-based pricing" };
  }

  return { type: "free" };
};
