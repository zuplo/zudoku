import { Head, Heading, Slot } from "zudoku/components";
import { useAuth, useZudoku } from "zudoku/hooks";
import { useQuery } from "zudoku/react-query";
import { useDeploymentName } from "../hooks/useDeploymentName";
import { usePlans } from "../hooks/usePlans";
import type { SubscriptionsResponse } from "../hooks/useSubscriptions";
import { useMonetizationConfig } from "../MonetizationContext";
import {
  collectDefaultTaxBehaviors,
  taxBehaviorLegendSentence,
} from "../utils/pricingTaxLegend.js";
import { PricingCard } from "./pricing/PricingCard";

const PricingPage = () => {
  const { pricing } = useMonetizationConfig();

  const zudoku = useZudoku();
  const deploymentName = useDeploymentName();
  const auth = useAuth();

  const { data: pricingTable } = usePlans();
  const taxLegendBehaviors = collectDefaultTaxBehaviors(pricingTable.items[0]);
  const taxLegendSentence = taxBehaviorLegendSentence(taxLegendBehaviors);

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
        <title>{pricing?.title ?? "Pricing"}</title>
        <meta
          name="description"
          content={
            pricing?.subtitle ??
            "See our pricing options and choose the one that best suits your needs."
          }
        />
      </Head>
      <div className="text-center space-y-4 mb-12">
        <Heading level={1} data-testid="title">
          {pricing?.title ?? "Pricing"}
        </Heading>
        <p className="text-muted-foreground" data-testid="subtitle">
          {pricing?.subtitle ??
            "See our pricing options and choose the one that best suits your needs."}
        </p>
      </div>
      {pricingTable.items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No plans are currently available.</p>
          <p className="text-sm mt-2">
            Make sure your plans are set up and published.
          </p>
        </div>
      ) : (
        <>
          <div className="w-full grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(300px,max-content))] justify-center gap-6">
            {pricingTable.items.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isPopular={plan.metadata?.zuplo_most_popular === "true"}
                isSubscribed={subscriptions.items.some((subscription) =>
                  ["active", "canceled"].includes(subscription.status),
                )}
              />
            ))}
          </div>
          {taxLegendSentence && (
            <div
              role="note"
              className="mt-10 pt-6 border-t border-border max-w-2xl mx-auto text-center space-y-2"
            >
              <p className="text-xs font-medium text-muted-foreground">
                Tax & Pricing
              </p>
              <p className="text-xs text-muted-foreground">
                {taxLegendSentence}
              </p>
            </div>
          )}
        </>
      )}
      <Slot.Target name="pricing-page-after" />
    </div>
  );
};

export default PricingPage;
