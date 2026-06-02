import type { Plan } from "../types/PlanType.js";

type CanonicalTaxBehavior = "exclusive" | "inclusive" | "unspecified";

const normalizeTaxBehavior = (behavior: string): CanonicalTaxBehavior => {
  const key = behavior.trim().toLowerCase();

  switch (key) {
    case "exclusive":
    case "tax_exclusive":
      return "exclusive";
    case "inclusive":
    case "tax_inclusive":
      return "inclusive";
    default:
      return "unspecified";
  }
};

export const planHasDefaultTaxBehavior = (plan: Plan): boolean => {
  const behavior = plan.defaultTaxConfig?.behavior;
  return typeof behavior === "string" && behavior.trim().length > 0;
};

export const collectDefaultTaxBehaviors = (
  plan: Plan,
): CanonicalTaxBehavior => {
  const behavior = plan.defaultTaxConfig?.behavior;
  return typeof behavior === "string" && behavior.trim().length > 0
    ? normalizeTaxBehavior(behavior)
    : "unspecified";
};

export const taxBehaviorLegendSentence = (
  behavior: string,
): string | undefined => {
  const key = normalizeTaxBehavior(behavior);
  switch (key) {
    case "exclusive":
      return "Prices exclude tax; taxes may be added at checkout if applicable.";
    case "inclusive":
      return "Prices include tax where applicable.";
    default:
      return undefined;
  }
};

export const subscriptionTaxLegendSentence = (
  behavior: string,
): string | undefined => {
  const key = normalizeTaxBehavior(behavior);
  switch (key) {
    case "exclusive":
      return "Price excludes tax; taxes may be added on invoice if applicable.";
    case "inclusive":
      return "Price includes tax where applicable.";
    default:
      return undefined;
  }
};
