import { type PropsWithChildren, useMemo, useState } from "react";
import { useZudoku } from "zudoku/hooks";
import { ArrowDownIcon, ArrowLeftRightIcon, ArrowUpIcon } from "zudoku/icons";
import { useMutation, useQuery } from "zudoku/react-query";
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
import { subscriptionsQuery } from "../../queries.js";
import type { Plan } from "../../types/PlanType.js";
import type { Subscription } from "../../types/SubscriptionType.js";
import { getActivePhase } from "../../utils/billables.js";
import { categorizeRateCards } from "../../utils/categorizeRateCards.js";
import type { EntitlementSet } from "../../utils/comparePlanEntitlements.js";
import {
  isNewerPlanVersion,
  planChangeCheckoutBody,
  resolvePlanChangeMode,
} from "../../utils/planChange.js";
import { categorizeSubscriptionItems } from "../../utils/subscriptionEntitlements.js";
import { CurrentPlanBaseline } from "../components/CurrentPlanBaseline.js";
import {
  type PlanChangeMode,
  PlanChangeCard,
} from "../components/PlanChangeCard.js";

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

        return {
          method: "POST",
          body: JSON.stringify(
            planChangeCheckoutBody(
              {
                planId: variables.plan.id,
                subscriptionId: variables.subscriptionId,
                mode: variables.mode,
              },
              generateUrl,
            ),
          ),
        };
      },
    },
    retry: false,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const subscribedPlan = subscription.plan;

  // Plans held by the customer's other current subscriptions can't be change
  // targets — the change would be rejected as a duplicate plan subscription.
  // Matched by key (stable across plan versions), falling back to id.
  const { data: subscriptionsData } = useQuery(subscriptionsQuery(context));
  const plansHeldByOtherSubscriptions = useMemo(() => {
    const others = (subscriptionsData?.items ?? []).filter(
      (s) =>
        s.id !== subscription.id && ["active", "canceled"].includes(s.status),
    );
    return {
      keys: new Set(others.flatMap((s) => (s.plan?.key ? [s.plan.key] : []))),
      ids: new Set(others.flatMap((s) => (s.plan?.id ? [s.plan.id] : []))),
    };
  }, [subscriptionsData?.items, subscription.id]);

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

    const entries = catalogItems.flatMap((plan) => {
      if (plan.id === subscribedPlan.id) return [];
      if (
        plansHeldByOtherSubscriptions.keys.has(plan.key) ||
        plansHeldByOtherSubscriptions.ids.has(plan.id)
      ) {
        return [];
      }
      return [
        {
          plan,
          mode: resolvePlanChangeMode({
            catalog: catalogItems,
            subscribedPlan,
            target: plan,
          }),
          isNewerVersion: isNewerPlanVersion(subscribedPlan, plan),
        },
      ];
    });

    return {
      upgrades: entries.filter((c) => c.mode === "upgrade"),
      downgrades: entries.filter((c) => c.mode === "downgrade"),
      privatePlans: entries.filter((c) => c.mode === "private"),
    };
  }, [plansData?.items, subscribedPlan, plansHeldByOtherSubscriptions]);

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
