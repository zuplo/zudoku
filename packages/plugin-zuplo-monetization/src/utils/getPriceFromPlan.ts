import type { Plan } from "../types/PlanType.js";

export const getPriceFromPlan = (plan: Plan) => {
  const monthly = plan.monthlyPrice != null ? parseFloat(plan.monthlyPrice) : 0;
  const yearly = plan.yearlyPrice != null ? parseFloat(plan.yearlyPrice) : 0;

  return { monthly, yearly };
};
