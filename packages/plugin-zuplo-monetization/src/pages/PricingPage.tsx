import { Head, Heading, Slot } from "zudoku/components";
import { useAuth, useZudoku } from "zudoku/hooks";
import { useQuery } from "zudoku/react-query";
import { useDeploymentName } from "../hooks/useDeploymentName";
import { usePlans } from "../hooks/usePlans";
import type { SubscriptionsResponse } from "../hooks/useSubscriptions";
import { PricingCard } from "./pricing/PricingCard";

const PricingPage = ({
  subtitle = "See our pricing options and choose the one that best suits your needs.",
  title = "Pricing",
  units,
  showYearlyPrice = true,
}: {
  subtitle?: string;
  title?: string;
  units?: Record<string, string>;
  showYearlyPrice?: boolean;
}) => {
  const zudoku = useZudoku();
  const deploymentName = useDeploymentName();
  const auth = useAuth();

  const { data: pricingTable } = usePlans();

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
        <Heading level={1} data-testid="title">
          {title}
        </Heading>
        <p className="text-muted-foreground" data-testid="subtitle">
          {subtitle}
        </p>
      </div>
      <div className="w-full grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(300px,max-content))] justify-center gap-6">
        {pricingTable.items.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            units={units}
            showYearlyPrice={showYearlyPrice}
            isPopular={plan.metadata?.zuplo_most_popular === "true"}
            isSubscribed={subscriptions.items.some((subscription) =>
              ["active", "canceled"].includes(subscription.status),
            )}
          />
        ))}
      </div>
      <Slot.Target name="pricing-page-after" />
    </div>
  );
};

export default PricingPage;
