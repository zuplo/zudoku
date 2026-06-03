import { FeatureItem } from "../../pricing-ui/FeatureItem.js";
import { PlanEntitlements } from "../../pricing-ui/PlanEntitlements.js";
import { QuotaItem } from "../../pricing-ui/QuotaItem.js";
import type { Subscription } from "../../types/SubscriptionType.js";
import { getActivePhase } from "../../utils/billables.js";
import { formatDuration } from "../../utils/formatDuration.js";
import { formatPlanPrice } from "../../utils/formatPlanPrice.js";
import { formatPrice } from "../../utils/formatPrice.js";
import { categorizeSubscriptionItems } from "../../utils/subscriptionEntitlements.js";

/**
 * Baseline shown at the top of the Switch Plan modal: the current plan's price
 * and what it actually includes, so users have a concrete reference to compare
 * targets against. Entitlements come from the subscription's *provisioned*
 * items (real included quotas), falling back to the plan's rate cards when
 * items aren't present.
 */
export const CurrentPlanBaseline = ({
  subscription,
  units,
}: {
  subscription: Subscription;
  units?: Record<string, string>;
}) => {
  const plan = subscription.plan;
  const currency = subscription.currency ?? plan.currency;
  const priceLabel = formatPlanPrice(plan);

  const activePhase = getActivePhase(subscription);
  const { quotas, features } = activePhase
    ? categorizeSubscriptionItems(activePhase.items ?? [], { currency, units })
    : { quotas: [], features: [] };
  const hasItems = quotas.length > 0 || features.length > 0;
  const hasPlanPhases = (plan.phases?.length ?? 0) > 0;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Current Plan
          </div>
          <div className="text-lg font-bold text-foreground">{plan.name}</div>
        </div>
        {priceLabel.type === "priced" ? (
          <div className="text-primary font-medium text-lg">
            {formatPrice(priceLabel.amount, currency)}/
            {formatDuration(plan.billingCadence)}
          </div>
        ) : priceLabel.type === "payg" ? (
          <div className="text-primary font-medium">Pay as you go</div>
        ) : (
          <div className="text-primary font-medium">Free</div>
        )}
      </div>

      {hasItems ? (
        <div className="mt-3 pt-3 border-t space-y-2">
          {quotas.map((quota) => (
            <QuotaItem key={quota.key} quota={quota} />
          ))}
          {features.map((feature) => (
            <FeatureItem key={feature.key} feature={feature} />
          ))}
        </div>
      ) : hasPlanPhases ? (
        <div className="mt-3 pt-3 border-t">
          <PlanEntitlements
            phases={plan.phases}
            currency={currency}
            billingCadence={plan.billingCadence}
            units={units}
          />
        </div>
      ) : null}
    </div>
  );
};
