import type { Plan } from "../types/PlanType.js";

/**
 * A plan is "custom" (contact-sales, no self-serve price) when its metadata
 * flags it via `zuplo_custom_plan`, matching the other zuplo_* plan metadata
 * conventions. Accepts boolean `true` or the string `"true"` — plan metadata
 * values arrive as strings from the API but may be set as booleans in
 * code/fixtures.
 */
export const isCustomPlan = (plan: Pick<Plan, "metadata">): boolean => {
  const flag = plan.metadata?.zuplo_custom_plan;
  return flag === true || flag === "true";
};
