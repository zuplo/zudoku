import type { ReactNode } from "react";
import type { Plan } from "../types/PlanType.js";
import { formatDuration } from "../utils/formatDuration.js";
import { formatPlanPrice } from "../utils/formatPlanPrice.js";
import { formatPrice } from "../utils/formatPrice.js";
import { isCustomPlan } from "../utils/isCustomPlan.js";
import { cn } from "./cn.js";
import { PlanEntitlements } from "./PlanEntitlements.js";

export type PricingCardProps = {
  plan: Plan;
  isPopular?: boolean;
  units?: Record<string, string>;
  /** CTA element rendered at the bottom of the card (e.g. a Subscribe button). */
  action?: ReactNode;
  className?: string;
};

export const PricingCard = ({
  plan,
  isPopular = false,
  units,
  action,
  className,
}: PricingCardProps) => {
  if (plan.phases.length === 0) return null;

  const priceLabel = formatPlanPrice(plan);

  const isCustom = isCustomPlan(plan);
  const billingInterval = formatDuration(plan.billingCadence);

  return (
    <div
      className={cn(
        "relative rounded-lg border p-6 flex flex-col",
        isPopular && "border-primary border-2",
        className,
      )}
    >
      {isPopular && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full uppercase">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-4 pb-4 border-b">
        <h3 className="text-base font-semibold text-muted-foreground mb-2">
          {plan.name}
        </h3>
        <div className="flex items-baseline gap-1 flex-wrap">
          {isCustom ? (
            <div>
              <div className="text-3xl font-bold text-card-foreground">
                Custom
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Contact Sales
              </div>
            </div>
          ) : priceLabel.type === "payg" ? (
            <div>
              <div className="text-2xl font-bold text-card-foreground text-balance">
                {priceLabel.main}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {priceLabel.sub}
              </div>
            </div>
          ) : priceLabel.type === "free" ? (
            <span className="text-3xl font-bold text-card-foreground">
              Free
            </span>
          ) : (
            <>
              <span className="text-3xl font-bold text-card-foreground">
                {formatPrice(priceLabel.amount, plan.currency)}
              </span>
              <span className="text-muted-foreground text-sm">
                /{billingInterval}
              </span>
            </>
          )}
        </div>
        {plan.paymentRequired === false && (
          <div className="text-sm text-muted-foreground mt-1">
            No CC required
          </div>
        )}
      </div>

      <div className="space-y-4 mb-6 grow">
        <PlanEntitlements
          phases={plan.phases}
          currency={plan.currency}
          billingCadence={plan.billingCadence}
          units={units}
        />
      </div>

      {action}
    </div>
  );
};
