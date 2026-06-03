import { PlanPriceTag } from "../../pricing-ui/PlanPriceTag.js";
import type { Subscription } from "../../types/SubscriptionType.js";
import {
  getSubscriptionPlanView,
  hasSubscriptionEntitlements,
} from "../../utils/subscriptionEntitlements.js";
import { SubscriptionEntitlements } from "./SubscriptionEntitlements.js";

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
  const view = getSubscriptionPlanView(subscription, { units });

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Current Plan
          </div>
          <div className="text-lg font-bold text-foreground">{plan.name}</div>
        </div>
        <PlanPriceTag
          label={view.priceLabel}
          currency={currency}
          billingCadence={plan.billingCadence}
        />
      </div>

      {hasSubscriptionEntitlements(view) && (
        <div className="mt-3 pt-3 border-t">
          <SubscriptionEntitlements
            view={view}
            currency={currency}
            billingCadence={plan.billingCadence}
            units={units}
          />
        </div>
      )}
    </div>
  );
};
