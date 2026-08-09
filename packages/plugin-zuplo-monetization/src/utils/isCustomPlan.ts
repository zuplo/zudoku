import type { Plan } from "../types/PlanType.js";

const isTruthyFlag = (flag: unknown): boolean =>
  flag === true || flag === "true";

/**
 * A plan is "custom" (contact-sales, no self-serve price) when its metadata
 * flags it. The canonical key is `zuplo_custom_plan` (matching the other
 * zuplo_* plan metadata conventions); the legacy `isCustom` spelling shipped
 * earlier and stays supported for plans that still carry it. The canonical
 * key wins when both are present. Accepts boolean `true` or the string
 * `"true"` — plan metadata values arrive as strings from the API but may be
 * set as booleans in code/fixtures.
 */
export const isCustomPlan = (plan: Pick<Plan, "metadata">): boolean => {
  const canonical = plan.metadata?.zuplo_custom_plan;
  if (canonical !== undefined) return isTruthyFlag(canonical);
  return isTruthyFlag(plan.metadata?.isCustom);
};
