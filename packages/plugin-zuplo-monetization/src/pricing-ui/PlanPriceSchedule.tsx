import { formatDuration } from "../utils/formatDuration.js";
import type { PlanPriceLabel } from "../utils/formatPlanPrice.js";
import { formatPrice } from "../utils/formatPrice.js";
import type { PlanPriceScheduleRow } from "../utils/getPlanPriceSchedule.js";
import { cn } from "./cn.js";

const RowPrice = ({
  price,
  currency,
  billingCadence,
  className,
}: {
  price: PlanPriceLabel;
  currency?: string;
  billingCadence?: string;
  className?: string;
}) => {
  if (price.type === "priced") {
    return (
      <span className={cn("font-semibold text-card-foreground", className)}>
        {formatPrice(price.amount, currency)}
        {billingCadence && (
          <span className="text-muted-foreground font-normal text-sm">
            /{formatDuration(billingCadence)}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={cn("font-semibold text-card-foreground", className)}>
      {price.type === "payg" ? price.main : "Free"}
    </span>
  );
};

/**
 * Stacked per-phase price rows for a multi-phase plan, replacing the single
 * headline price (which only reflects the steady-state phase): each row pairs
 * a phase label ("First 3 months", "After that") with that phase's own price.
 * Every row gets equal visual weight — the intro price is part of the plan's
 * price, not a footnote.
 *
 * Callers derive the rows via {@link getPlanPriceSchedule} and fall back to
 * the single-price rendering when it returns `undefined`. `size` picks the
 * typographic treatment: `"lg"` for a card's headline area, `"sm"` for
 * compact contexts (plan-change rows, summary cards).
 */
export const PlanPriceSchedule = ({
  schedule,
  currency,
  billingCadence,
  size = "sm",
  className,
}: {
  schedule: PlanPriceScheduleRow[];
  currency?: string;
  /** Render each priced row with the `/cadence` suffix (the plan's billing cadence). */
  billingCadence?: string;
  size?: "sm" | "lg";
  className?: string;
}) => (
  <div className={cn("space-y-1 text-sm", className)}>
    {schedule.map((row) => (
      <div key={row.key} className="flex items-baseline justify-between gap-3">
        <span className="text-muted-foreground">{row.label}</span>
        <RowPrice
          price={row.price}
          currency={currency}
          billingCadence={billingCadence}
          className={size === "lg" ? "text-lg" : undefined}
        />
      </div>
    ))}
  </div>
);
