import { Card, CardContent, CardHeader, CardTitle } from "zudoku/ui/Card";
import { Separator } from "zudoku/ui/Separator";
import { PlanEntitlements } from "../../pricing-ui/PlanEntitlements.js";
import { PlanPriceTag } from "../../pricing-ui/PlanPriceTag.js";
import type { Plan } from "../../types/PlanType.js";
import { formatBillingCycle } from "../../utils/formatBillingCycle.js";
import { formatDuration } from "../../utils/formatDuration.js";
import { formatPlanPrice } from "../../utils/formatPlanPrice.js";
import { formatMinorCurrencyAmount } from "../../utils/formatPrice.js";
import { parseRateCardOrder } from "../../utils/rateCardOrder.js";

/**
 * Plan summary shown on the checkout and plan-change confirmation pages: an
 * avatar + name/description on the left and the headline price (or
 * "Free" / "Pay as you go") plus tax and billing cadence on the right,
 * followed by the plan's included entitlements.
 *
 * The price is derived from the plan's rate cards via {@link formatPlanPrice}
 * and rendered in the plan's own billing cadence, so it stays correct for any
 * cadence (e.g. `$2.99/hour`).
 */
export const PlanSummaryCard = ({
  plan,
  descriptionFallback,
  taxAmount,
  taxLabel,
  taxInclusive,
  units,
  entitlementsItemClassName,
}: {
  plan: Plan;
  descriptionFallback: string;
  taxAmount?: number;
  taxLabel: string;
  taxInclusive: boolean;
  units?: Record<string, string>;
  entitlementsItemClassName?: string;
}) => {
  const priceLabel = formatPlanPrice(plan);
  const billingCycle = plan.billingCadence
    ? formatDuration(plan.billingCadence)
    : null;

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-2xl font-bold bg-primary text-primary-foreground items-center justify-center rounded size-12">
              {plan.name.at(0)?.toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold">{plan.name}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {plan.description || descriptionFallback}
              </span>
            </div>
          </div>
          <div className="text-right">
            <PlanPriceTag
              label={priceLabel}
              currency={plan.currency}
              size="lg"
              description
            />
            {priceLabel.type === "priced" && (
              <>
                {taxAmount != null && (
                  <div className="text-sm font-normal mt-1">
                    {taxInclusive
                      ? `${formatMinorCurrencyAmount(taxAmount, plan.currency)} ${taxLabel} included`
                      : `+ ${formatMinorCurrencyAmount(taxAmount, plan.currency)} ${taxLabel}`}
                  </div>
                )}
                {billingCycle && (
                  <div className="text-sm text-muted-foreground font-normal">
                    Billed {formatBillingCycle(billingCycle)}
                  </div>
                )}
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Separator />
        <div className="text-sm font-medium mb-3 mt-3">What's included:</div>
        <PlanEntitlements
          phases={plan.phases}
          currency={plan.currency}
          billingCadence={plan.billingCadence}
          units={units}
          itemClassName={entitlementsItemClassName}
          rateCardOrder={parseRateCardOrder(plan)}
        />
      </CardContent>
    </Card>
  );
};
