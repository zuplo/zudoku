import { cn } from "zudoku";
import { Button } from "zudoku/components";
import { Link } from "zudoku/router";
import { PlanEntitlements } from "../../components/PlanEntitlements.js";
import { useMonetizationConfig } from "../../MonetizationContext";
import type { Plan } from "../../types/PlanType";
import { formatDuration } from "../../utils/formatDuration";
import { formatPrice } from "../../utils/formatPrice";
import { getPriceFromPlan } from "../../utils/getPriceFromPlan";

export const PricingCard = ({
  plan,
  isPopular = false,
  isSubscribed = false,
}: {
  plan: Plan;
  isPopular?: boolean;
  isSubscribed?: boolean;
}) => {
  const { pricing } = useMonetizationConfig();

  if (plan.phases.length === 0) return null;

  const price = getPriceFromPlan(plan);
  const isFree = price.monthly === 0;

  const isCustom = plan.metadata?.isCustom === true;
  const billingInterval = formatDuration(plan.billingCadence);

  return (
    <div
      className={cn(
        "relative rounded-lg border p-6 flex flex-col",
        isPopular && "border-primary border-2",
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
          ) : (
            <>
              <span className="text-3xl font-bold text-card-foreground">
                {isFree ? "Free" : formatPrice(price.monthly, plan.currency)}
              </span>
              {!isFree && (
                <>
                  <span className="text-muted-foreground text-sm">
                    /{billingInterval}
                  </span>
                  {pricing?.showYearlyPrice !== false && price.yearly > 0 && (
                    <div className="w-full text-sm text-muted-foreground mt-1">
                      {formatPrice(price.yearly, plan.currency)}/year
                    </div>
                  )}
                </>
              )}
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
          units={pricing?.units}
        />
      </div>

      {isSubscribed ? (
        <Button variant={isPopular ? "default" : "outline"} asChild>
          <Link to={`/subscriptions#manage`}>Manage Subscriptions</Link>
        </Button>
      ) : (
        <Button variant={isPopular ? "default" : "outline"} asChild>
          <Link to={`/checkout?planId=${encodeURIComponent(plan.id)}`}>
            Subscribe
          </Link>
        </Button>
      )}
    </div>
  );
};
