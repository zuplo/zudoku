import { Button, Head, Heading, Slot } from "zudoku/components";
import { useAuth, useZudoku } from "zudoku/hooks";
import { useQuery } from "zudoku/react-query";
import { Link } from "zudoku/router";
import { usePlans } from "../hooks/usePlans";
import { useMonetizationConfig } from "../MonetizationContext";
import { PricingTable } from "../pricing-ui/PricingTable.js";
import { subscriptionsQuery } from "../queries.js";

const PricingPage = () => {
  const { pricing } = useMonetizationConfig();

  const zudoku = useZudoku();
  const auth = useAuth();

  const { data: pricingTable } = usePlans();

  const { data: subscriptions = { items: [] } } = useQuery({
    ...subscriptionsQuery(zudoku),
    enabled: auth.isAuthenticated,
  });

  const isSubscribed = subscriptions.items.some((subscription) =>
    ["active", "canceled"].includes(subscription.status),
  );

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
      <PricingTable
        plans={pricingTable.items}
        units={pricing?.units}
        renderAction={(plan, isPopular) =>
          isSubscribed ? (
            <Button variant={isPopular ? "default" : "outline"} asChild>
              <Link to={`/subscriptions#manage`}>Manage Subscriptions</Link>
            </Button>
          ) : (
            <Button variant={isPopular ? "default" : "outline"} asChild>
              <Link to={`/checkout?planId=${encodeURIComponent(plan.id)}`}>
                Subscribe
              </Link>
            </Button>
          )
        }
      />
      <Slot.Target name="pricing-page-after" />
    </div>
  );
};

export default PricingPage;
