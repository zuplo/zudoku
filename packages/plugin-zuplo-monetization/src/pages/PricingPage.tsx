import { cn } from "zudoku";
import { Heading } from "zudoku/components";
import { useSuspenseQuery } from "zudoku/react-query";
import type { Plan } from "../types/PlanType";
import { PricingCard } from "./pricing/PricingCard";

const PricingPage = ({ environmentName }: { environmentName: string }) => {
  const { data: pricingTableData } = useSuspenseQuery<{ items: Plan[] }>({
    queryKey: [`/v3/zudoku-metering/${environmentName}/pricing-page`],
  });

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
