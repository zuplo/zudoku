import { type ReactNode, useMemo, useState } from "react";
import { cn } from "zudoku";
import {
  ArrowDownIcon,
  ArrowLeftRightIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  XIcon,
} from "zudoku/icons";
import { Badge } from "zudoku/ui/Badge";
import { Button } from "zudoku/ui/Button";
import { PlanEntitlements } from "../../pricing-ui/PlanEntitlements.js";
import type { Plan } from "../../types/PlanType.js";
import { categorizeRateCards } from "../../utils/categorizeRateCards.js";
import {
  comparePlanEntitlements,
  type EntitlementChange,
  type EntitlementSet,
} from "../../utils/comparePlanEntitlements.js";
import { formatDuration } from "../../utils/formatDuration.js";
import { formatPhaseRampSummary } from "../../utils/formatPhaseRampSummary.js";
import { formatPlanPrice } from "../../utils/formatPlanPrice.js";
import { formatPrice } from "../../utils/formatPrice.js";
import { isCustomPlan } from "../../utils/isCustomPlan.js";

export type PlanChangeMode = "upgrade" | "downgrade" | "private";

const MODE_LABEL: Record<PlanChangeMode, string> = {
  upgrade: "Upgrade",
  downgrade: "Downgrade",
  private: "Switch",
};

// How many change rows to show before collapsing the rest behind "details".
const MAX_SUMMARY_ROWS = 3;

const ChangeRow = ({ change }: { change: EntitlementChange }) => {
  const arrow = (
    <>
      <span className="text-muted-foreground">{change.currentValue}</span>
      <span className="text-muted-foreground">→</span>
    </>
  );

  let icon: ReactNode;
  let body: ReactNode;
  switch (change.change) {
    case "added":
      icon = <CheckIcon className="size-4 text-green-600 shrink-0 mt-0.5" />;
      body = (
        <>
          <span className="font-medium">{change.label}</span>
          {change.targetValue ? (
            <span className="text-muted-foreground">
              : {change.targetValue}
            </span>
          ) : null}
          <span className="text-green-600"> — now included</span>
        </>
      );
      break;
    case "removed":
      icon = <XIcon className="size-4 text-destructive shrink-0 mt-0.5" />;
      body = (
        <>
          <span className="font-medium">{change.label}</span>
          <span className="text-destructive"> — no longer included</span>
        </>
      );
      break;
    case "increase":
      icon = <ArrowUpIcon className="size-4 text-primary shrink-0 mt-0.5" />;
      body = (
        <>
          <span className="font-medium">{change.label}:</span> {arrow}
          <span className="font-medium text-primary">{change.targetValue}</span>
        </>
      );
      break;
    case "decrease":
      icon = (
        <ArrowDownIcon className="size-4 text-amber-600 shrink-0 mt-0.5" />
      );
      body = (
        <>
          <span className="font-medium">{change.label}:</span> {arrow}
          <span className="font-medium text-amber-600">
            {change.targetValue}
          </span>
        </>
      );
      break;
    default: // "changed" (incl. cross-cadence) — neutral, no direction implied
      icon = (
        <ArrowLeftRightIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
      );
      body = (
        <>
          <span className="font-medium">{change.label}:</span> {arrow}
          <span className="font-medium">{change.targetValue}</span>
        </>
      );
  }

  return (
    <div className="flex items-start gap-2 text-sm">
      {icon}
      <div className="flex flex-wrap items-baseline gap-1">{body}</div>
    </div>
  );
};

export const PlanChangeCard = ({
  plan,
  mode,
  currentEntitlements,
  isNewerVersion,
  isSwitching,
  units,
  onSwitch,
}: {
  plan: Plan;
  mode: PlanChangeMode;
  /** Current subscription's entitlements, for the "what changes" summary. */
  currentEntitlements: EntitlementSet;
  isNewerVersion: boolean;
  isSwitching: boolean;
  units?: Record<string, string>;
  onSwitch: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isCustom = isCustomPlan(plan);
  const priceLabel = formatPlanPrice(plan);
  const ramp = formatPhaseRampSummary(plan);

  const meaningfulChanges = useMemo(() => {
    const steadyPhase = plan.phases.at(-1);
    const target = steadyPhase
      ? categorizeRateCards(steadyPhase.rateCards, {
          currency: plan.currency,
          units,
          planBillingCadence: plan.billingCadence,
        })
      : { quotas: [], features: [] };
    return comparePlanEntitlements(currentEntitlements, target).filter(
      (c) => c.change !== "same",
    );
  }, [plan, currentEntitlements, units]);

  const shownChanges = meaningfulChanges.slice(0, MAX_SUMMARY_ROWS);
  const hiddenCount = meaningfulChanges.length - shownChanges.length;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">{plan.name}</h4>
            {isNewerVersion && (
              <Badge
                variant="outline"
                className="rounded-full border-primary/30 bg-primary/10 text-primary font-medium"
              >
                New version
              </Badge>
            )}
          </div>
          {isCustom ? (
            <span className="text-primary font-medium">Custom</span>
          ) : priceLabel.type === "priced" ? (
            <span className="text-primary font-medium text-lg">
              {formatPrice(priceLabel.amount, plan.currency)}/
              {formatDuration(plan.billingCadence)}
            </span>
          ) : priceLabel.type === "payg" ? (
            <span className="text-primary font-medium">Pay as you go</span>
          ) : (
            <span className="text-primary font-medium">Free</span>
          )}
        </div>
        {isCustom ? (
          <Button variant="default" size="sm">
            Contact Sales
          </Button>
        ) : (
          <Button
            variant={mode === "upgrade" ? "default" : "outline"}
            onClick={onSwitch}
            size="sm"
            disabled={isSwitching}
          >
            {MODE_LABEL[mode]}
          </Button>
        )}
      </div>

      {ramp && <p className="text-sm text-muted-foreground mb-2">{ramp}</p>}

      {shownChanges.length > 0 && (
        <div className="space-y-1.5">
          {shownChanges.map((change) => (
            <ChangeRow key={`${change.kind}:${change.key}`} change={change} />
          ))}
        </div>
      )}

      {plan.phases.length > 0 && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 -ml-2 h-auto py-1 text-muted-foreground"
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronDownIcon
              className={cn(
                "size-4 transition-transform",
                expanded && "rotate-180",
              )}
            />
            {expanded
              ? "Hide details"
              : hiddenCount > 0
                ? `Show all details (+${hiddenCount} more)`
                : "Show plan details"}
          </Button>
          {expanded && (
            <div className="mt-2 pt-3 border-t">
              <PlanEntitlements
                phases={plan.phases}
                currency={plan.currency}
                billingCadence={plan.billingCadence}
                units={units}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
