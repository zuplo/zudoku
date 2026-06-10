import { ChevronDownIcon } from "zudoku/icons";
import { Card, CardContent, CardHeader, CardTitle } from "zudoku/ui/Card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "zudoku/ui/Collapsible";
import { Separator } from "zudoku/ui/Separator";
import { PlanEntitlements } from "../../pricing-ui/PlanEntitlements.js";
import { PlanPriceSchedule } from "../../pricing-ui/PlanPriceSchedule.js";
import { PlanPriceTag } from "../../pricing-ui/PlanPriceTag.js";
import type { Plan } from "../../types/PlanType.js";
import { formatBillingCycle } from "../../utils/formatBillingCycle.js";
import { formatDuration } from "../../utils/formatDuration.js";
import { formatPlanPrice } from "../../utils/formatPlanPrice.js";
import { formatMinorCurrencyAmount } from "../../utils/formatPrice.js";
import { getPlanPriceSchedule } from "../../utils/getPlanPriceSchedule.js";

/**
 * Plan summary shown on the checkout and plan-change confirmation pages: an
 * avatar + name/description on the left and the headline price (or
 * "Free" / "Pay as you go") plus tax and billing cadence on the right,
 * followed by the plan's included entitlements. Multi-phase ramp plans render
 * a full-width per-phase price schedule beneath the title instead of the
 * single right-column price.
 *
 * The price is derived from the plan's rate cards via {@link formatPlanPrice}
 * and rendered in the plan's own billing cadence, so it stays correct for any
 * cadence (e.g. `$2.99/hour`).
 *
 * Pass `collapsibleDetails` to hide the "What's included" section behind a
 * collapsed-by-default toggle — used on the plan-change confirmation page where
 * the current and new plan are stacked and the user opens each to compare. Pass
 * `label` to render a small eyebrow above the name (e.g. "Current plan").
 */
export const PlanSummaryCard = ({
  plan,
  label,
  descriptionFallback,
  taxAmount,
  taxLabel,
  taxInclusive,
  units,
  entitlementsItemClassName,
  collapsibleDetails = false,
}: {
  plan: Plan;
  label?: string;
  descriptionFallback: string;
  taxAmount?: number;
  taxLabel: string;
  taxInclusive: boolean;
  units?: Record<string, string>;
  entitlementsItemClassName?: string;
  collapsibleDetails?: boolean;
}) => {
  const priceLabel = formatPlanPrice(plan);
  const schedule = getPlanPriceSchedule(plan);
  const billingCycle = plan.billingCadence
    ? formatDuration(plan.billingCadence)
    : null;

  const taxLine = taxAmount != null && (
    <div className="text-sm font-normal mt-1">
      {taxInclusive
        ? `${formatMinorCurrencyAmount(taxAmount, plan.currency)} ${taxLabel} included`
        : `+ ${formatMinorCurrencyAmount(taxAmount, plan.currency)} ${taxLabel}`}
    </div>
  );
  const billedLine = billingCycle && (
    <div className="text-sm text-muted-foreground font-normal">
      Billed {formatBillingCycle(billingCycle)}
    </div>
  );

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-2xl font-bold bg-primary text-primary-foreground items-center justify-center rounded size-12">
              {plan.name.at(0)?.toUpperCase()}
            </div>
            <div className="flex flex-col">
              {label && (
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {label}
                </span>
              )}
              <span className="text-lg font-bold">{plan.name}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {plan.description || descriptionFallback}
              </span>
            </div>
          </div>
          {!schedule && (
            <div className="text-right">
              <PlanPriceTag
                label={priceLabel}
                currency={plan.currency}
                size="lg"
                description
              />
              {priceLabel.type === "priced" && (
                <>
                  {taxLine}
                  {billedLine}
                </>
              )}
            </div>
          )}
        </CardTitle>
        {schedule && (
          <div className="mt-3 font-normal">
            <PlanPriceSchedule
              schedule={schedule}
              currency={plan.currency}
              billingCadence={plan.billingCadence}
            />
            <div className="text-right">
              {taxLine}
              {billedLine}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Separator />
        {collapsibleDetails ? (
          <Collapsible>
            <CollapsibleTrigger className="group flex w-full items-center justify-between text-sm font-medium mt-3">
              Plan details
              <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <PlanEntitlements
                phases={plan.phases}
                currency={plan.currency}
                billingCadence={plan.billingCadence}
                units={units}
                itemClassName={entitlementsItemClassName}
              />
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <>
            <div className="text-sm font-medium mb-3 mt-3">
              What's included:
            </div>
            <PlanEntitlements
              phases={plan.phases}
              currency={plan.currency}
              billingCadence={plan.billingCadence}
              units={units}
              itemClassName={entitlementsItemClassName}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};
