import { useMemo, useState } from "react";
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
import { useNavigate } from "zudoku/router";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert";
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
import type { Feature, Plan, Quota } from "../../types/PlanType.js";
import { categorizeRateCards } from "../../utils/categorizeRateCards.js";
import { getPriceFromPlan } from "../../utils/getPriceFromPlan.js";
import { queryClient } from "../../ZuploMonetizationWrapper.js";

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

const comparePlans = (
  currentPlan: Plan | undefined,
  targetPlan: Plan,
): PlanComparison => {
  const currentPrice = currentPlan ? getPriceFromPlan(currentPlan).monthly : 0;
  const targetPrice = getPriceFromPlan(targetPlan).monthly;
  const isUpgrade = targetPrice > currentPrice;

  const currentPhase = currentPlan?.phases.at(-1);
  const targetPhase = targetPlan.phases.at(-1);

  const { quotas: currentQuotas, features: currentFeatures } = currentPhase
    ? categorizeRateCards(currentPhase.rateCards)
    : { quotas: [] as Quota[], features: [] as Feature[] };

  const { quotas: targetQuotas, features: targetFeatures } = targetPhase
    ? categorizeRateCards(targetPhase.rateCards)
    : { quotas: [] as Quota[], features: [] as Feature[] };

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
      quotaChanges.push({
        key: key ?? "",
        name: target.name,
        currentValue: null,
        newValue: target.limit,
        period: target.period,
        change: "added",
      });
    } else if (current && !target) {
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
      featureChanges.push({
        key: key ?? "",
        name: target.name,
        currentValue: null,
        newValue: target.value ?? true,
        change: "added",
      });
    } else if (current && !target) {
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

const PlanComparisonItem = ({
  comparison,
  subscriptionId,
  onRequestClose,
}: {
  comparison: PlanComparison;
  subscriptionId: string;
  onRequestClose: () => void;
}) => {
  const deploymentName = useDeploymentName();
  const context = useZudoku();
  const navigate = useNavigate();
  const mutation = useMutation<Subscription>({
    mutationKey: [
      `/v3/zudoku-metering/${deploymentName}/subscriptions/${subscriptionId}/change`,
    ],
    meta: {
      context,
      request: {
        method: "POST",
        body: JSON.stringify({ planId: comparison.plan.id }),
      },
    },
    retry: false,
    onSuccess: async (subscription) => {
      await queryClient.invalidateQueries();
      navigate(`/subscriptions/${subscription.id}`, {
        state: {
          upgradeFrom: subscription.annotations?.["subscription.previous.id"],
        },
      });
      onRequestClose();
    },
  });

  const price = getPriceFromPlan(comparison.plan);
  const isCustom = comparison.plan.key === "enterprise";
  const displayPrice = price.monthly;

  const hasChanges =
    comparison.quotaChanges.some((q) => q.change !== "same") ||
    comparison.featureChanges.some((f) => f.change !== "same");

  return (
    <>
      {mutation.error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{JSON.stringify(mutation.error)}</AlertDescription>
        </Alert>
      )}
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
                ${displayPrice.toLocaleString()}/ mo
              </span>
            )}
          </div>
          {isCustom ? (
            <Button variant="default" size="sm">
              Contact Sales
            </Button>
          ) : (
            <Button
              variant={comparison.isUpgrade ? "default" : "outline"}
              size="sm"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {comparison.isUpgrade ? "Upgrade" : "Downgrade"}
            </Button>
          )}
        </div>

        {hasChanges && (
          <div className="space-y-1.5">
            {comparison.quotaChanges
              .filter((q) => q.change !== "same")
              .map((quota) => (
                <div
                  key={quota.key}
                  className="flex items-center gap-2 text-sm"
                >
                  <ChangeIndicator change={quota.change} />
                  <span className="font-medium">{quota.name}:</span>
                  {quota.change === "added" ? (
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

            {comparison.featureChanges
              .filter((f) => f.change !== "same")
              .map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center gap-2 text-sm"
                >
                  {feature.change === "added" ? (
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
                      <span className="text-destructive">
                        No longer included
                      </span>
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
    </>
  );
};

export const SwitchPlanModal = ({
  subscription,
}: {
  subscription: Subscription;
}) => {
  const [open, setOpen] = useState(false);
  const deploymentName = useDeploymentName();
  const { data: plansData } = usePlans(deploymentName);

  const currentPlan = plansData?.items.find(
    (p) => p.id === subscription.plan.id,
  );

  const { upgrades, downgrades } = useMemo(() => {
    if (!plansData?.items || !currentPlan) {
      return { upgrades: [], downgrades: [] };
    }

    const allComparisons = plansData.items
      .filter((p) => p.id !== currentPlan.id)
      .map((plan) => comparePlans(currentPlan, plan));

    return {
      upgrades: allComparisons.filter((c) => c.isUpgrade),
      downgrades: allComparisons.filter((c) => !c.isUpgrade),
    };
  }, [plansData?.items, currentPlan]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowLeftRightIcon /> Switch Plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className="sm:max-w-2xl max-h-[70vh] overflow-y-auto ">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-semibold">
              Change Your Plan
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Currently on{" "}
              <span className="font-medium">{currentPlan?.name}</span>
            </p>
          </DialogHeader>
          <div className="mt-4 space-y-6">
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
                      onRequestClose={() => setOpen(false)}
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
                      onRequestClose={() => setOpen(false)}
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
