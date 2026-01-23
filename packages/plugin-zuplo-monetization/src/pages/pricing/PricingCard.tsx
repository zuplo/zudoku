import { cn } from "zudoku";
import { Button } from "zudoku/components";
import { Link } from "zudoku/router";
import { FeatureItem } from "../../components/FeatureItem";
import { QuotaItem } from "../../components/QuotaItem";
import type { Plan } from "../../types/PlanType";
import { categorizeRateCards } from "../../utils/categorizeRateCards";
import { getPriceFromPlan } from "../../utils/getPriceFromPlan";

export const PricingCard = ({
  plan,
  isPopular = false,
  disabled = false,
}: {
  plan: Plan;
  isPopular?: boolean;
  disabled?: boolean;
}) => {
  const defaultPhase = plan.phases.at(-1);
  if (!defaultPhase) return null;

  const { quotas, features } = categorizeRateCards(defaultPhase.rateCards);
  const price = getPriceFromPlan(plan);
  const isFree = price.monthly === 0;
  const isCustom = plan.key === "enterprise";

  return (
    <div
      className={cn(
        "relative rounded-lg border p-6 flex flex-col min-w-72",
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
                {isFree ? "Free" : `$${price.monthly.toLocaleString()}`}
              </span>
              {!isFree && (
                <>
                  <span className="text-muted-foreground text-sm">/mo</span>
                  <div className="w-full text-sm text-muted-foreground mt-1">
                    ${price.yearly.toLocaleString()}/year
                  </div>
                </>
              )}
            </>
          )}
        </div>
        {isFree && (
          <div className="text-sm text-muted-foreground mt-1">
            No CC required
          </div>
        )}
      </div>

      <div className="space-y-4 mb-6  grow">
        {quotas.length > 0 && (
          <div className="space-y-2">
            {quotas.map((quota) => (
              <QuotaItem key={quota.key} quota={quota} />
            ))}
          </div>
        )}

        {features.length > 0 && (
          <div className="space-y-2">
            {features.map((feature) => (
              <FeatureItem key={feature.key} feature={feature} />
            ))}
          </div>
        )}
      </div>

      {disabled ? (
        <Button disabled variant={isPopular ? "default" : "secondary"}>
          Already subscribed
        </Button>
      ) : (
        <Button variant={isPopular ? "default" : "secondary"} asChild>
          <Link to={`/checkout/${plan.id}`}>Subscribe</Link>
        </Button>
      )}
    </div>
  );
};
