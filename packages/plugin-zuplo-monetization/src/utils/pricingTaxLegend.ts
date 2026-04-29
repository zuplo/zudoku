import type { Plan } from "../types/PlanType.js";

export const planHasDefaultTaxBehavior = (plan: Plan): boolean => {
  const behavior = plan.defaultTaxConfig?.behavior;
  return typeof behavior === "string" && behavior.trim().length > 0;
};

export const collectDefaultTaxBehaviors = (plans: Plan[]): string[] => {
  const seen = new Set<string>();
  for (const plan of plans) {
    const behavior = plan.defaultTaxConfig?.behavior;
    if (typeof behavior === "string" && behavior.trim().length > 0) {
      seen.add(behavior.trim());
    }
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
};

export const taxBehaviorLegendSentence = (behavior: string): string => {
  const key = behavior.trim().toLowerCase();
  switch (key) {
    case "exclusive":
      return "Prices exclude tax; applicable taxes are calculated at checkout.";
    case "inclusive":
      return "Prices include applicable tax where required.";
    default:
      return ``;
  }
};
