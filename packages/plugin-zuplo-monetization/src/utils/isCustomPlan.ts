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
