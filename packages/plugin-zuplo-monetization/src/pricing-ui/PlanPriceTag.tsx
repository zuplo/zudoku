import { formatDuration } from "../utils/formatDuration.js";
import type { PlanPriceLabel } from "../utils/formatPlanPrice.js";
import { formatPrice } from "../utils/formatPrice.js";

/**
 * Headline price for a plan/subscription: `$X/cadence`, "Pay as you go", or
 * "Free", from a {@link PlanPriceLabel}. Shared by the subscription details
 * page, the Switch Plan baseline, each plan-change card, and the checkout /
 * plan-change summary cards so they all render the price identically.
 *
 * `size` selects the typographic treatment:
 *   - `"inline"` (default): compact, primary-colored text for use beside a name.
 *   - `"lg"`: a large foreground headline for a summary card's price column.
 *
 * Pass `description` to surface the "Usage-based pricing" subline under the
 * "Pay as you go" headline (used where there's room for it).
 */
export const PlanPriceTag = ({
  label,
  currency,
  billingCadence,
  description = false,
  size = "inline",
}: {
  label: PlanPriceLabel;
  currency?: string;
  /** Render the `/cadence` suffix (omit for prices shown without a cadence). */
  billingCadence?: string;
  description?: boolean;
  size?: "inline" | "lg";
}) => {
  const isLg = size === "lg";

  if (label.type === "priced") {
    return (
      <span
        className={
          isLg ? "text-2xl font-bold" : "text-primary font-medium text-lg"
        }
      >
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
      <span
        className={
          isLg ? "text-2xl font-bold text-balance" : "text-primary font-medium"
        }
      >
        {label.main}
        {description && (
          <span
            className={
              isLg
                ? "block text-sm text-muted-foreground font-normal mt-1"
                : "block text-xs text-muted-foreground font-normal"
            }
          >
            {label.sub}
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={
        isLg
          ? "text-2xl text-muted-foreground font-bold"
          : "text-primary font-medium"
      }
    >
      Free
    </span>
  );
};
