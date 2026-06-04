import { type ReactNode, useMemo } from "react";
import {
  ArrowDownIcon,
  ArrowLeftRightIcon,
  ArrowUpIcon,
  CheckIcon,
  XIcon,
} from "zudoku/icons";
import { Badge } from "zudoku/ui/Badge";
import { Button } from "zudoku/ui/Button";
import { PlanPriceTag } from "../../pricing-ui/PlanPriceTag.js";
import type { Plan } from "../../types/PlanType.js";
import { categorizeRateCards } from "../../utils/categorizeRateCards.js";
import {
  comparePlanEntitlements,
  type EntitlementChange,
  type EntitlementSet,
} from "../../utils/comparePlanEntitlements.js";
import { formatPhaseRampSummary } from "../../utils/formatPhaseRampSummary.js";
import { formatPlanPrice } from "../../utils/formatPlanPrice.js";
import { isCustomPlan } from "../../utils/isCustomPlan.js";

export type PlanChangeMode = "upgrade" | "downgrade" | "private";

const MODE_LABEL: Record<PlanChangeMode, string> = {
  upgrade: "Upgrade",
  downgrade: "Downgrade",
  private: "Switch",
};

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
          {change.targetValue && change.targetValue !== "Included" ? (
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
    case "same":
      // Unchanged entitlement — rendered plainly so the highlighted rows
      // (added/removed/in-/decrease) stand out against the full list.
      icon = (
        <CheckIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
      );
      body = (
        <>
          <span>{change.label}</span>
          {change.targetValue && change.targetValue !== "Included" && (
            <span className="text-muted-foreground">
              : {change.targetValue}
            </span>
          )}
        </>
      );
      break;
    default: // "changed" (incl. cross-cadence) — neutral, no direction implied
      icon = (
        <ArrowLeftRightIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
      );
      body = (
        <>
          <span className="font-medium">{change.label}:</span>{" "}
          {/* Equal labels (e.g. two different tier schedules both reading
              "Tiered pricing") would render a meaningless "X → X" — the ⇄ icon
              plus the breakdown below already convey the change. */}
          {change.currentValue !== change.targetValue && arrow}
          <span className="font-medium">{change.targetValue}</span>
        </>
      );
  }

  return (
    <div className="flex items-start gap-2 text-sm">
      {icon}
      <div>
        <div className="flex flex-wrap items-baseline gap-1">{body}</div>
        {change.tierPrices && change.tierPrices.length > 0 && (
          <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
            {change.tierPrices.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
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
  const isCustom = isCustomPlan(plan);
  const priceLabel = formatPlanPrice(plan);
  const ramp = formatPhaseRampSummary(plan);

  // The target plan's FULL entitlement list (steady-state phase), annotated
  // against the current plan: unchanged rows render plainly while added /
  // removed / changed rows are highlighted. Removed rows last, so the list
  // reads as "what you'll have, then what you'll lose".
  const entitlementChanges = useMemo(() => {
    const steadyPhase = plan.phases.at(-1);
    const target = steadyPhase
      ? categorizeRateCards(steadyPhase.rateCards, {
          currency: plan.currency,
          units,
          planBillingCadence: plan.billingCadence,
        })
      : { quotas: [], features: [] };
    const changes = comparePlanEntitlements(currentEntitlements, target);
    return [
      ...changes.filter((c) => c.change !== "removed"),
      ...changes.filter((c) => c.change === "removed"),
    ];
  }, [plan, currentEntitlements, units]);

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
          ) : (
            <PlanPriceTag
              label={priceLabel}
              currency={plan.currency}
              billingCadence={plan.billingCadence}
            />
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

      {entitlementChanges.length > 0 && (
        <div className="space-y-1.5">
          {entitlementChanges.map((change) => (
            <ChangeRow key={`${change.kind}:${change.key}`} change={change} />
          ))}
        </div>
      )}
    </div>
  );
};
