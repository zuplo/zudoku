import { type PropsWithChildren, useMemo, useState } from "react";
import { cn } from "zudoku";
import { useZudoku } from "zudoku/hooks";
import {
  ArrowDownIcon,
  ArrowLeftRightIcon,
  ArrowUpIcon,
  CheckIcon,
  XIcon,
} from "zudoku/icons";
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
import { Item, ItemContent, ItemDescription, ItemTitle } from "zudoku/ui/Item";
import { useDeploymentName } from "../../hooks/useDeploymentName.js";
import { usePlans } from "../../hooks/usePlans.js";
import type { Subscription } from "../../hooks/useSubscriptions.js";
import { useUrlUtils } from "../../hooks/useUrlUtils.js";
import { useMonetizationConfig } from "../../MonetizationContext";
import type { Plan } from "../../types/PlanType.js";
import { categorizeRateCards } from "../../utils/categorizeRateCards.js";
import { formatDuration } from "../../utils/formatDuration.js";
import { formatPrice } from "../../utils/formatPrice.js";
import { getPriceFromPlan } from "../../utils/getPriceFromPlan.js";

type PlanComparison = {
  plan: Plan;
  isUpgrade: boolean;
  quotaChanges: QuotaChange[];
  featureChanges: FeatureChange[];
};

type QuotaChange = {
  key: string;
  name: string;
  currentValue: number | null;
  newValue: number | null;
  period: string;
  change: "increase" | "decrease" | "same" | "added" | "removed";
};

type FeatureChange = {
  key: string;
  name: string;
  currentValue: string | boolean | null;
  newValue: string | boolean | null;
  change: "added" | "removed" | "upgraded" | "downgraded" | "same";
};

// Collect all feature keys across ALL phases to detect cross-category matches
// (e.g. a key that's a boolean feature in one plan but a metered quota in another)
const getAllKeysAcrossPhases = (
  plan: Plan,
  units?: Record<string, string>,
): { quotaKeys: Set<string>; featureKeys: Set<string> } => {
  const quotaKeys = new Set<string>();
  const featureKeys = new Set<string>();

  for (const phase of plan.phases) {
    const { quotas, features } = categorizeRateCards(phase.rateCards, {
      currency: plan.currency,
      units,
      planBillingCadence: plan.billingCadence,
    });
    for (const q of quotas) quotaKeys.add(q.key);
    for (const f of features) featureKeys.add(f.key);
  }

  return { quotaKeys, featureKeys };
};

const comparePlans = (
  currentPlan: Plan | undefined,
  targetPlan: Plan,
  currentIndex: number,
  targetIndex: number,
  units?: Record<string, string>,
): PlanComparison => {
  const isUpgrade = targetIndex > currentIndex;

  // Use the last phase (permanent steady state) for comparison values
  const currentPhase = currentPlan?.phases.at(-1);
  const targetPhase = targetPlan.phases.at(-1);

  const { quotas: currentQuotas, features: currentFeatures } = currentPhase
    ? categorizeRateCards(currentPhase.rateCards, {
        currency: currentPlan?.currency,
        units,
        planBillingCadence: currentPlan?.billingCadence,
      })
    : { quotas: [], features: [] };

  const { quotas: targetQuotas, features: targetFeatures } = targetPhase
    ? categorizeRateCards(targetPhase.rateCards, {
        currency: targetPlan.currency,
        units,
        planBillingCadence: targetPlan.billingCadence,
      })
    : { quotas: [], features: [] };

  // Look across ALL phases to detect cross-category keys
  const currentAllKeys = currentPlan
    ? getAllKeysAcrossPhases(currentPlan, units)
    : { quotaKeys: new Set<string>(), featureKeys: new Set<string>() };
  const targetAllKeys = getAllKeysAcrossPhases(targetPlan, units);

  const quotaChanges: QuotaChange[] = [];
  const allQuotaKeys = new Set([
    ...currentQuotas.map((q) => q.key),
    ...targetQuotas.map((q) => q.key),
  ]);

  for (const key of allQuotaKeys) {
    const current = currentQuotas.find((q) => q.key === key);
    const target = targetQuotas.find((q) => q.key === key);

    if (current && target) {
      let change: QuotaChange["change"] = "same";
      if (target.limit > current.limit) change = "increase";
      else if (target.limit < current.limit) change = "decrease";

      quotaChanges.push({
        key: key ?? "",
        name: target.name,
        currentValue: current.limit,
        newValue: target.limit,
        period: target.period,
        change,
      });
    } else if (target && !current) {
      // Cross-category: feature in current plan becomes quota in target, show value
      if (currentAllKeys.featureKeys.has(key)) {
        quotaChanges.push({
          key: key ?? "",
          name: target.name,
          currentValue: null,
          newValue: target.limit,
          period: target.period,
          change: "same",
        });
        continue;
      }
      quotaChanges.push({
        key: key ?? "",
        name: target.name,
        currentValue: null,
        newValue: target.limit,
        period: target.period,
        change: "added",
      });
    } else if (current && !target) {
      // Cross-category: quota in current becomes feature in target, show as feature
      if (targetAllKeys.featureKeys.has(key)) continue;
      quotaChanges.push({
        key: key ?? "",
        name: current.name,
        currentValue: current.limit,
        newValue: null,
        period: current.period,
        change: "removed",
      });
    }
  }

  const featureChanges: FeatureChange[] = [];
  const allFeatureKeys = new Set([
    ...currentFeatures.map((f) => f.key),
    ...targetFeatures.map((f) => f.key),
  ]);

  for (const key of allFeatureKeys) {
    const current = currentFeatures.find((f) => f.key === key);
    const target = targetFeatures.find((f) => f.key === key);

    if (current && target) {
      let change: FeatureChange["change"] = "same";
      if (current.value && target.value && current.value !== target.value) {
        change = isUpgrade ? "upgraded" : "downgraded";
      }
      featureChanges.push({
        key: key ?? "",
        name: target.name,
        currentValue: current.value ?? true,
        newValue: target.value ?? true,
        change,
      });
    } else if (target && !current) {
      // Cross-category: quota in current becomes feature in target, show as "same"
      if (currentAllKeys.quotaKeys.has(key)) {
        featureChanges.push({
          key: key ?? "",
          name: target.name,
          currentValue: true,
          newValue: target.value ?? true,
          change: "same",
        });
        continue;
      }
      featureChanges.push({
        key: key ?? "",
        name: target.name,
        currentValue: null,
        newValue: target.value ?? true,
        change: "added",
      });
    } else if (current && !target) {
      // Cross-category: feature in current becomes quota in target, handled in quota loop
      if (targetAllKeys.quotaKeys.has(key)) continue;
      featureChanges.push({
        key: key ?? "",
        name: current.name,
        currentValue: current.value ?? true,
        newValue: null,
        change: "removed",
      });
    }
  }

  return { plan: targetPlan, isUpgrade, quotaChanges, featureChanges };
};

const ChangeIndicator = ({
  change,
}: {
  change: QuotaChange["change"] | FeatureChange["change"];
}) => {
  if (change === "increase" || change === "added" || change === "upgraded") {
    return <ArrowUpIcon className="w-4 h-4 text-primary shrink-0" />;
  }
  if (
    change === "decrease" ||
    change === "removed" ||
    change === "downgraded"
  ) {
    return <ArrowDownIcon className="w-4 h-4 text-amber-600 shrink-0" />;
  }
  return <CheckIcon className="w-4 h-4 text-green-600 shrink-0" />;
};

const modeLabelMap: Record<SwitchPlanTarget["mode"], string> = {
  upgrade: "Upgrade",
  downgrade: "Downgrade",
  private: "Switch",
};

const isSwitchPlanTarget = (value: unknown): value is SwitchPlanTarget => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (
    !("subscriptionId" in value) ||
    !("plan" in value) ||
    !("mode" in value)
  ) {
    return false;
  }

  return true;
};

const PlanComparisonItem = ({
  comparison,
  subscriptionId,
  mode,
  onRequestChange,
  isSwitching,
}: {
  comparison: PlanComparison;
  subscriptionId: string;
  mode: SwitchPlanTarget["mode"];
  onRequestChange: (switchTo: SwitchPlanTarget) => void;
  isSwitching: boolean;
}) => {
  const price = getPriceFromPlan(comparison.plan);
  const isCustom = comparison.plan.key === "enterprise";
  const displayPrice = price.monthly;

  const hasChanges =
    comparison.quotaChanges.length > 0 || comparison.featureChanges.length > 0;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <h4 className="font-semibold text-foreground">
            {comparison.plan.name}
          </h4>
          {isCustom ? (
            <span className="text-primary font-medium">Custom</span>
          ) : displayPrice === 0 ? (
            <span className="text-primary font-medium">Free</span>
          ) : (
            <span className="text-primary font-medium text-lg">
              {formatPrice(displayPrice, comparison.plan.currency)}/
              {formatDuration(comparison.plan.billingCadence)}
            </span>
          )}
        </div>
        {isCustom ? (
          <Button variant="default" size="sm">
            Contact Sales
          </Button>
        ) : (
          <Button
            variant={mode === "upgrade" ? "default" : "outline"}
            onClick={() =>
              onRequestChange({
                subscriptionId,
                plan: comparison.plan,
                mode,
              })
            }
            size="sm"
            disabled={isSwitching}
          >
            {modeLabelMap[mode]}
          </Button>
        )}
      </div>

      {hasChanges && (
        <div className="space-y-1.5">
          {comparison.quotaChanges.map((quota) => (
            <div key={quota.key} className="flex items-center gap-2 text-sm">
              <ChangeIndicator change={quota.change} />
              <span className="font-medium">{quota.name}:</span>
              {quota.change === "same" ? (
                <span className="text-muted-foreground">
                  {(quota.newValue ?? quota.currentValue)?.toLocaleString()}/
                  {quota.period}
                </span>
              ) : quota.change === "added" ? (
                <span className="text-green-600">Now included</span>
              ) : quota.change === "removed" ? (
                <span className="text-destructive">No longer included</span>
              ) : (
                <>
                  <span className="text-muted-foreground">
                    {quota.currentValue?.toLocaleString()}/{quota.period}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span
                    className={cn(
                      "font-medium",
                      quota.change === "increase"
                        ? "text-primary"
                        : "text-amber-600",
                    )}
                  >
                    {quota.newValue?.toLocaleString()}/{quota.period}
                  </span>
                </>
              )}
            </div>
          ))}

          {comparison.featureChanges.map((feature) => (
            <div key={feature.key} className="flex items-center gap-2 text-sm">
              {feature.change === "same" ? (
                <>
                  <CheckIcon className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-muted-foreground">
                    {feature.name}
                    {typeof feature.newValue === "string"
                      ? `: ${feature.newValue}`
                      : typeof feature.currentValue === "string"
                        ? `: ${feature.currentValue}`
                        : ""}
                  </span>
                </>
              ) : feature.change === "added" ? (
                <>
                  <CheckIcon className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-muted-foreground font-medium">
                    {feature.name}
                  </span>
                  <span className="text-green-600">—</span>
                  <span className="text-green-600">Now included</span>
                </>
              ) : feature.change === "removed" ? (
                <>
                  <XIcon className="w-4 h-4 text-destructive shrink-0" />
                  <span className="font-medium">{feature.name}</span>
                  <span className="text-destructive">—</span>
                  <span className="text-destructive">No longer included</span>
                </>
              ) : (
                <>
                  <ChangeIndicator change={feature.change} />
                  <span className="">{feature.name}:</span>
                  <span className="text-muted-foreground">
                    {typeof feature.currentValue === "string"
                      ? feature.currentValue
                      : "Included"}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span
                    className={cn(
                      feature.change === "upgraded"
                        ? "text-green-600"
                        : "text-destructive",
                    )}
                  >
                    {typeof feature.newValue === "string"
                      ? feature.newValue
                      : "Included"}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export type SwitchPlanTarget = {
  subscriptionId: string;
  plan: Plan;
  mode: "upgrade" | "downgrade" | "private";
};

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

  const currentPlan = plansData?.items.find(
    (p) => p.key === subscription.plan.key,
  );

  const { upgrades, downgrades, privatePlans } = useMemo(() => {
    if (!plansData?.items || !currentPlan) {
      return { upgrades: [], downgrades: [], privatePlans: [] };
    }

    const isPrivatePlan = (plan: Plan) =>
      plan.metadata?.zuplo_private_plan === "true";

    const currentIndex = plansData.items.findIndex(
      (p) => p.id === currentPlan.id,
    );
    const allComparisons = plansData.items
      .filter((p) => p.id !== currentPlan.id)
      .map((plan) => {
        const targetIndex = plansData.items.indexOf(plan);
        return comparePlans(
          currentPlan,
          plan,
          currentIndex,
          targetIndex,
          pricing?.units,
        );
      });

    return {
      upgrades: allComparisons.filter(
        (c) => c.isUpgrade && !isPrivatePlan(c.plan),
      ),
      downgrades: allComparisons.filter(
        (c) => !c.isUpgrade && !isPrivatePlan(c.plan),
      ),
      privatePlans: allComparisons.filter((c) => isPrivatePlan(c.plan)),
    };
  }, [plansData?.items, currentPlan, pricing?.units]);

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
            {currentPlan && (
              <Item variant="outline">
                <ItemContent>
                  <ItemTitle>Current Plan</ItemTitle>
                  <ItemDescription className="text-lg font-bold">
                    {currentPlan.name}
                  </ItemDescription>
                </ItemContent>
              </Item>
            )}

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
                <div className="space-y-3">
                  {upgrades.map((comparison) => (
                    <PlanComparisonItem
                      key={comparison.plan.id}
                      comparison={comparison}
                      subscriptionId={subscription.id}
                      mode="upgrade"
                      onRequestChange={(target) =>
                        switchPlanMutation.mutate(target)
                      }
                      isSwitching={switchPlanMutation.isPending}
                    />
                  ))}
                </div>
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
                    Takes effect next billing cycle
                  </span>
                </div>
                <div className="space-y-3">
                  {downgrades.map((comparison) => (
                    <PlanComparisonItem
                      key={comparison.plan.id}
                      comparison={comparison}
                      subscriptionId={subscription.id}
                      mode="downgrade"
                      onRequestChange={(target) =>
                        switchPlanMutation.mutate(target)
                      }
                      isSwitching={switchPlanMutation.isPending}
                    />
                  ))}
                </div>
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
                <div className="space-y-3">
                  {privatePlans.map((comparison) => (
                    <PlanComparisonItem
                      key={comparison.plan.id}
                      comparison={comparison}
                      subscriptionId={subscription.id}
                      mode="private"
                      onRequestChange={(target) =>
                        switchPlanMutation.mutate(target)
                      }
                      isSwitching={switchPlanMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
