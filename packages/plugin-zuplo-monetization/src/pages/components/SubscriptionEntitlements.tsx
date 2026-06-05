import { EntitlementList } from "../../pricing-ui/EntitlementList.js";
import { PlanEntitlements } from "../../pricing-ui/PlanEntitlements.js";
import type { SubscriptionPlanView } from "../../utils/subscriptionEntitlements.js";

/**
 * Render a subscription's entitlements from a resolved
 * {@link SubscriptionPlanView}: the active phase's *provisioned* items when
 * present (the real included quotas + per-unit prices), otherwise the catalog
 * plan's phases. Centralizes the "items, else fall back to plan phases" branch
 * shared by the subscription details page and the Switch Plan baseline.
 *
 * Renders `null` when there's nothing to show, so callers can wrap it with
 * {@link hasSubscriptionEntitlements} (for a section header / border) without
 * leaving an empty container behind.
 */
export const SubscriptionEntitlements = ({
  view,
  currency,
  billingCadence,
  units,
  itemClassName,
}: {
  view: SubscriptionPlanView;
  currency?: string;
  billingCadence?: string;
  units?: Record<string, string>;
  itemClassName?: string;
}) => {
  if (view.usingItems) {
    return (
      <EntitlementList
        items={view.entitlements.items}
        itemClassName={itemClassName}
      />
    );
  }

  if (view.fallbackPhases.length === 0) return null;
  return (
    <PlanEntitlements
      phases={view.fallbackPhases}
      currency={currency}
      billingCadence={billingCadence}
      units={units}
      itemClassName={itemClassName}
      rateCardOrder={view.rateCardOrder}
    />
  );
};
