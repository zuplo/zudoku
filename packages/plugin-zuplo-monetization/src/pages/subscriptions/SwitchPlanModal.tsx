import { type PropsWithChildren, useMemo, useState } from "react";
import { useZudoku } from "zudoku/hooks";
import { ArrowDownIcon, ArrowLeftRightIcon, ArrowUpIcon } from "zudoku/icons";
import { useMutation } from "zudoku/react-query";
import { Alert, AlertDescription } from "zudoku/ui/Alert";
import { Button } from "zudoku/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "zudoku/ui/Dialog";
import { useDeploymentName } from "../../hooks/useDeploymentName.js";
import { usePlans } from "../../hooks/usePlans.js";
import { useUrlUtils } from "../../hooks/useUrlUtils.js";
import { useMonetizationConfig } from "../../MonetizationContext";
import type { Plan } from "../../types/PlanType.js";
import type { Subscription } from "../../types/SubscriptionType.js";
import { getActivePhase } from "../../utils/billables.js";
import { categorizeRateCards } from "../../utils/categorizeRateCards.js";
import type { EntitlementSet } from "../../utils/comparePlanEntitlements.js";
import { categorizeSubscriptionItems } from "../../utils/subscriptionEntitlements.js";
import { CurrentPlanBaseline } from "../components/CurrentPlanBaseline.js";
import {
  type PlanChangeMode,
  PlanChangeCard,
} from "../components/PlanChangeCard.js";

const isPrivatePlan = (plan: Plan) =>
  plan.metadata?.zuplo_private_plan === "true";

const planVersion = (plan: Pick<Plan, "version">) => plan.version ?? 1;

const isNewerPlanVersion = (subscribedPlan: Plan, target: Plan): boolean =>
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
  // the modal's timing copy is a prediction the confirm page confirms via the
  // server's authoritative `activeFrom`.
  return targetIndex >= currentIndex;
};

export type SwitchPlanTarget = {
  subscriptionId: string;
  plan: Plan;
  mode: PlanChangeMode;
};

const isSwitchPlanTarget = (value: unknown): value is SwitchPlanTarget =>
  typeof value === "object" &&
  value !== null &&
  "subscriptionId" in value &&
  "plan" in value &&
  "mode" in value;

type PlanEntry = { plan: Plan; isNewerVersion: boolean };

export const SwitchPlanModal = ({
  subscription,
  children,
}: PropsWithChildren<{
  subscription: Subscription;
}>) => {
  const [open, setOpen] = useState(false);
  const { data: plansData } = usePlans();
  const { pricing } = useMonetizationConfig();
  const deploymentName = useDeploymentName();
  const context = useZudoku();
  const { generateUrl } = useUrlUtils();

  const switchPlanMutation = useMutation<
    { url: string },
    Error,
    SwitchPlanTarget
  >({
    mutationKey: [`/v3/zudoku-metering/${deploymentName}/stripe/checkout`],
    meta: {
      context,
      request: (variables) => {
        if (!isSwitchPlanTarget(variables)) {
          throw new Error(
            "Couldn't start the plan change. Please refresh and try again.",
          );
        }

        const switchTo = variables;
        return {
          method: "POST",
          body: JSON.stringify({
            planId: switchTo.plan.id,
            successURL: generateUrl(`/subscription-change-confirm`, {
              searchParams: {
                planId: switchTo.plan.id,
                subscriptionId: switchTo.subscriptionId,
                mode: switchTo.mode,
              },
            }),
            cancelURL: generateUrl("/subscriptions", {
              searchParams: { subscriptionId: switchTo.subscriptionId },
            }),
          }),
        };
      },
    },
    retry: false,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const subscribedPlan = subscription.plan;

  // The current plan's entitlements, sourced from the subscription's actual
  // provisioned items (real included quotas), with the catalog plan as a
  // fallback. Used by each target card's "what changes" summary.
  const currentEntitlements: EntitlementSet = useMemo(() => {
    const currency = subscription.currency ?? subscribedPlan.currency;
    const activePhase = getActivePhase(subscription);
    if (activePhase && (activePhase.items?.length ?? 0) > 0) {
      return categorizeSubscriptionItems(activePhase.items, {
        currency,
        units: pricing?.units,
      });
    }
    const lastPhase = subscribedPlan.phases?.at(-1);
    return lastPhase
      ? categorizeRateCards(lastPhase.rateCards, {
          currency,
          units: pricing?.units,
          planBillingCadence: subscribedPlan.billingCadence,
        })
      : { quotas: [], features: [] };
  }, [subscription, subscribedPlan, pricing?.units]);

  const { upgrades, downgrades, privatePlans } = useMemo(() => {
    const catalogItems = plansData?.items;
    if (!catalogItems?.length) {
      return {
        upgrades: [] as PlanEntry[],
        downgrades: [] as PlanEntry[],
        privatePlans: [] as PlanEntry[],
      };
    }

    const subscribedOnCatalog = catalogItems.some(
      (p) => p.id === subscribedPlan.id,
    );
    const currentIndex = subscribedOnCatalog
      ? catalogItems.findIndex((p) => p.id === subscribedPlan.id)
      : -1;
    const subscribedIsPrivate = isPrivatePlan(subscribedPlan);

    const entries = catalogItems.flatMap((plan, targetIndex) => {
      if (plan.id === subscribedPlan.id) return [];
      return [
        {
          plan,
          isUpgrade: resolveIsUpgrade({
            target: plan,
            targetIndex,
            subscribedPlan,
            currentIndex,
          }),
          isNewerVersion: isNewerPlanVersion(subscribedPlan, plan),
        },
      ];
    });

    // Private subscriptions: public targets are upgrades, private targets switch.
    if (subscribedIsPrivate) {
      return {
        upgrades: entries.filter((c) => !isPrivatePlan(c.plan)),
        downgrades: [] as PlanEntry[],
        privatePlans: entries.filter((c) => isPrivatePlan(c.plan)),
      };
    }

    return {
      upgrades: entries.filter((c) => c.isUpgrade && !isPrivatePlan(c.plan)),
      downgrades: entries.filter((c) => !c.isUpgrade && !isPrivatePlan(c.plan)),
      privatePlans: entries.filter((c) => isPrivatePlan(c.plan)),
    };
  }, [plansData?.items, subscribedPlan]);

  const renderCards = (entries: PlanEntry[], mode: PlanChangeMode) => (
    <div className="space-y-3">
      {entries.map(({ plan, isNewerVersion }) => (
        <PlanChangeCard
          key={plan.id}
          plan={plan}
          mode={mode}
          currentEntitlements={currentEntitlements}
          isNewerVersion={isNewerVersion}
          isSwitching={switchPlanMutation.isPending}
          units={pricing?.units}
          onSwitch={() =>
            switchPlanMutation.mutate({
              subscriptionId: subscription.id,
              plan,
              mode,
            })
          }
        />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm">
            <ArrowLeftRightIcon /> Switch Plan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <div className="sm:max-w-2xl max-h-[70vh] overflow-y-auto ">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-semibold">
              Change Your Plan
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            {switchPlanMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription className="first-letter:uppercase">
                  {switchPlanMutation.error.message}
                </AlertDescription>
              </Alert>
            )}

            <CurrentPlanBaseline
              subscription={subscription}
              units={pricing?.units}
            />

            {upgrades.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpIcon className="size-5 text-muted-foreground" />
                    <span className="font-medium text-primary">
                      Upgrade Options
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Takes effect immediately
                  </span>
                </div>
                {renderCards(upgrades, "upgrade")}
              </div>
            )}

            {downgrades.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ArrowDownIcon className="size-5 text-primary" />
                    <span className="font-medium text-foreground">
                      Downgrade Options
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Takes effect at your next billing cycle
                  </span>
                </div>
                {renderCards(downgrades, "downgrade")}
              </div>
            )}

            {privatePlans.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRightIcon className="size-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      Private Plan Option
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Takes effect immediately
                  </span>
                </div>
                {renderCards(privatePlans, "private")}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
