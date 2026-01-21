import { cn } from "zudoku";
import { Button, Heading } from "zudoku/components";
import { Link } from "zudoku/router";

import { FeatureItem } from "../components/FeatureItem.js";
import { QuotaItem } from "../components/QuotaItem.js";
import { usePlans } from "../hooks/usePlans.js";
import type { Plan } from "../types/PlanType.js";
import { categorizeRateCards } from "../utils/categorizeRateCards.js";
import { getPriceFromPlan } from "../utils/getPriceFromPlan.js";

const PricingCard = ({
  plan,
  isPopular = false,
}: {
  plan: Plan;
  isPopular?: boolean;
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

      <div className="space-y-4 mb-6 flex-grow">
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

      <Button variant={isPopular ? "default" : "secondary"} asChild>
        <Link to={`/checkout?plan=${plan.id}`}>Subscribe</Link>
      </Button>
    </div>
  );
};

const PricingPage = ({ environmentName }: { environmentName: string }) => {
  const { data: pricingTableData } = usePlans(environmentName);

  const planOrder = ["developer", "startup", "pro", "business", "enterprise"];
  const sortedPlans = [...pricingTableData.items].sort((a, b) => {
    return planOrder.indexOf(a.key) - planOrder.indexOf(b.key);
  });

  const getGridCols = (count: number) => {
    if (count === 1) return "lg:grid-cols-1";
    if (count === 2) return "lg:grid-cols-2";
    if (count === 3) return "lg:grid-cols-3";
    if (count === 4) return "lg:grid-cols-4";
    return "lg:grid-cols-5";
  };

  return (
    <div className="w-full px-4 py-12">
      <div className="text-center mb-12">
        <Heading level={1}>Pricing</Heading>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Global live music data, flexible plans for every scale
        </p>
      </div>

      <div className="flex justify-center">
        <div
          className={cn(
            "w-full md:w-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:max-w-fit",
            getGridCols(sortedPlans.length),
          )}
        >
          {sortedPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isPopular={plan.key === "pro"}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
