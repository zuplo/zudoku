import { Head, Heading } from "zudoku/components";
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
  const auth = useAuth();

  const { data: pricingTable } = useSuspenseQuery<{ items: Plan[] }>({
    queryKey: [`/v3/zudoku-metering/${deploymentName}/pricing-page`],
  });
  const { data: subscriptions = { items: [] } } =
    useQuery<SubscriptionsResponse>({
      meta: {
        context: zudoku,
      },
      queryKey: [`/v3/zudoku-metering/${deploymentName}/subscriptions`],
      enabled: auth.isAuthenticated,
    });

  return (
    <div className="w-full px-4 pt-(--padding-content-top) pb-(--padding-content-bottom)">
      <Head>
        <title>{title}</title>
        <meta name="description" content={subtitle} />
      </Head>
      <div className="text-center space-y-4 mb-12">
        <Heading level={1}>{title}</Heading>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      <div className="w-full grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(300px,max-content))] justify-center gap-6">
        {pricingTable.items.slice(0, 4).map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            // TODO: should be determined by the metadata
            isPopular={plan.key === "pro"}
            disabled={subscriptions.items.some(
              (subscription) =>
                ["active", "canceled"].includes(subscription.status) &&
                subscription.plan.id === plan.id,
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
