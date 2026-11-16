import type { PlanChangeMode } from "../pages/components/PlanChangeCard.js";
import type { Plan } from "../types/PlanType.js";

type GenerateUrl = (
  path: string,
  options?: { searchParams?: Record<string, string> },
) => string;

export const isPrivatePlan = (plan: Plan) =>
  plan.metadata?.zuplo_private_plan === "true";

const planVersion = (plan: Pick<Plan, "version">) => plan.version ?? 1;

export const isNewerPlanVersion = (subscribedPlan: Plan, target: Plan) =>
  target.key === subscribedPlan.key &&
  planVersion(target) > planVersion(subscribedPlan);

const resolveIsUpgrade = ({
  target,
  targetIndex,
  subscribedPlan,
  currentIndex,
}: {
  target: Plan;
  targetIndex: number;
  subscribedPlan: Plan;
  currentIndex: number;
}): boolean => {
  if (target.key === subscribedPlan.key) {
    return planVersion(target) > planVersion(subscribedPlan);
  }
  // Mirror the backend's planOrder rule (`newOrder >= currentOrder`). The
  // catalog is sorted by the same planOrder, so index is a faithful proxy;
  // the switch UI's timing copy is a prediction the confirm page confirms via
  // the server's authoritative `activeFrom`.
  return targetIndex >= currentIndex;
};

/**
 * How switching `subscribedPlan` to `target` is classified. Private targets
 * are always a "private" switch; from a private subscription every public
 * target is an upgrade; otherwise catalog order (planOrder) decides.
 */
export const resolvePlanChangeMode = ({
  catalog,
  subscribedPlan,
  target,
}: {
  catalog: Plan[];
  subscribedPlan: Plan;
  target: Plan;
}): PlanChangeMode => {
  if (isPrivatePlan(target)) return "private";
  if (isPrivatePlan(subscribedPlan)) return "upgrade";

  return resolveIsUpgrade({
    target,
    targetIndex: catalog.findIndex((p) => p.id === target.id),
    subscribedPlan,
    currentIndex: catalog.findIndex((p) => p.id === subscribedPlan.id),
  })
    ? "upgrade"
    : "downgrade";
};

export type StripeCheckoutBody = {
  planId: string;
  successURL: string;
  cancelURL: string;
};

/** Body for `POST stripe/checkout` that changes an existing subscription's plan. */
export const planChangeCheckoutBody = (
  {
    planId,
    subscriptionId,
    mode,
  }: { planId: string; subscriptionId: string; mode: PlanChangeMode },
  generateUrl: GenerateUrl,
): StripeCheckoutBody => ({
  planId,
  successURL: generateUrl("/subscription-change-confirm", {
    searchParams: { planId, subscriptionId, mode },
  }),
  cancelURL: generateUrl("/subscriptions", {
    searchParams: { subscriptionId },
  }),
});
