import type { Plan } from "../types/PlanType.js";

/**
 * A plan is "custom" (contact-sales, no self-serve price) when its metadata
 * flags it. Mirrors the convention used by the pricing card
 * (`PricingCard.tsx`), accepting boolean `true` or the string `"true"` — plan
 * metadata values arrive as strings from the API but may be set as booleans in
 * code/fixtures.
 */
export const isCustomPlan = (plan: Pick<Plan, "metadata">): boolean => {
  const flag = plan.metadata?.isCustom;
  return flag === true || flag === "true";
};

/**
 * True when the plan should be presented as contact-sales: flagged custom AND
 * the current user is not invited. The pricing page sets `invited` for the
 * signed-in user; invited users see the plan's real price and can subscribe
 * (the gateway validates and consumes their invite server-side).
 */
export const isContactSalesPlan = (
  plan: Pick<Plan, "metadata" | "invited">,
): boolean => isCustomPlan(plan) && plan.invited !== true;
