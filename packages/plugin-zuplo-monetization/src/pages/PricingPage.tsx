import { cn } from "zudoku";
import { Heading } from "zudoku/components";
import { useAuth, useZudoku } from "zudoku/hooks";
import { useQuery, useSuspenseQuery } from "zudoku/react-query";
import { useDeploymentName } from "../hooks/useDeploymentName";
import type { SubscriptionsResponse } from "../hooks/useSubscriptions";
import type { Plan } from "../types/PlanType";
import { PricingCard } from "./pricing/PricingCard";

const PricingPage = ({
  subtitle = "See our pricing options and choose the one that best suits your needs.",
  title = "Pricing",
}: {
  subtitle?: string;
  title?: string;
}) => {
  const zudoku = useZudoku();
  const deploymentName = useDeploymentName();

  const { data: pricingTable } = useSuspenseQuery<{ items: Plan[] }>({
    queryKey: [`/v3/zudoku-metering/${deploymentName}/pricing-page`],
  });
  const auth = useAuth();
  const { data: subscriptions = { items: [] } } =
    useQuery<SubscriptionsResponse>({
      meta: {
        context: zudoku,
      },
      queryKey: [`/v3/zudoku-metering/${deploymentName}/subscriptions`],
      enabled: auth.isAuthenticated,
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
        <Heading level={1}>{title}</Heading>
        <p className="text-lg text-gray-600 dark:text-gray-400">{subtitle}</p>
      </div>

      <div className="flex justify-center">
        <div
          className={cn(
            "w-full md:w-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:max-w-fit",
            getGridCols(pricingTable?.items?.length ?? 0),
          )}
        >
          {pricingTable?.items?.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isPopular={plan.key === "pro"}
              disabled={subscriptions.items.some(
                (subscription) =>
                  subscription.status === "active" &&
                  subscription.plan.id === plan.id,
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
