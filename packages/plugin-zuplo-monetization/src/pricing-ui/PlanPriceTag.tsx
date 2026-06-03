import { formatDuration } from "../utils/formatDuration.js";
import type { PlanPriceLabel } from "../utils/formatPlanPrice.js";
import { formatPrice } from "../utils/formatPrice.js";

/**
 * Inline headline price for a plan/subscription: `$X/cadence`, "Pay as you go",
 * or "Free", from a {@link PlanPriceLabel}. Shared by the subscription details
 * page, the Switch Plan baseline, and each plan-change card so all three render
 * the price identically.
 *
 * Pass `description` to surface the "Usage-based pricing" subline under the
 * "Pay as you go" headline (used where there's room for it).
 */
export const PlanPriceTag = ({
  label,
  currency,
  billingCadence,
  description = false,
}: {
  label: PlanPriceLabel;
  currency?: string;
  /** Render the `/cadence` suffix (omit for prices shown without a cadence). */
  billingCadence?: string;
  description?: boolean;
}) => {
  if (label.type === "priced") {
    return (
      <span className="text-primary font-medium text-lg">
        {formatPrice(label.amount, currency)}
        {billingCadence && (
          <span className="text-muted-foreground font-normal">
            /{formatDuration(billingCadence)}
          </span>
        )}
      </span>
    );
  }

  if (label.type === "payg") {
    return (
      <span className="text-primary font-medium">
        {label.main}
        {description && (
          <span className="block text-xs text-muted-foreground font-normal">
            {label.sub}
          </span>
        )}
      </span>
    );
  }

  return <span className="text-primary font-medium">Free</span>;
};
