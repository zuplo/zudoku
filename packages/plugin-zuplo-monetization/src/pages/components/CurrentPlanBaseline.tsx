import { FeatureItem } from "../../pricing-ui/FeatureItem.js";
import { PlanEntitlements } from "../../pricing-ui/PlanEntitlements.js";
import { QuotaItem } from "../../pricing-ui/QuotaItem.js";
import type { Subscription } from "../../types/SubscriptionType.js";
import { formatDuration } from "../../utils/formatDuration.js";
import { formatPrice } from "../../utils/formatPrice.js";
import { getSubscriptionPlanView } from "../../utils/subscriptionEntitlements.js";

/**
 * Baseline shown at the top of the Switch Plan modal: the current plan's price
 * and what it actually includes, so users have a concrete reference to compare
 * targets against. Both the price and the entitlements come from the
 * subscription's *provisioned* items (real included quotas + recurring fees),
 * falling back to the plan's rate cards only when items aren't present — see
 * {@link getSubscriptionPlanView}.
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
  const { priceLabel, entitlements, fallbackPhases, usingItems } =
    getSubscriptionPlanView(subscription, { units });

  const hasItems =
    usingItems &&
    (entitlements.quotas.length > 0 || entitlements.features.length > 0);

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
          {entitlements.quotas.map((quota) => (
            <QuotaItem key={quota.key} quota={quota} />
          ))}
          {entitlements.features.map((feature) => (
            <FeatureItem key={feature.key} feature={feature} />
          ))}
        </div>
      ) : !usingItems && fallbackPhases.length > 0 ? (
        <div className="mt-3 pt-3 border-t">
          <PlanEntitlements
            phases={fallbackPhases}
            currency={currency}
            billingCadence={plan.billingCadence}
            units={units}
          />
        </div>
      ) : null}
    </div>
  );
};
