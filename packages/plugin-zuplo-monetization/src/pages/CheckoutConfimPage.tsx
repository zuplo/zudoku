import { Button } from "zudoku/components";
import { useAuth, useZudoku } from "zudoku/hooks";
import { ArrowLeftIcon, CheckIcon, LockIcon } from "zudoku/icons";
import { useMutation } from "zudoku/react-query";
import { useNavigate, useSearchParams } from "zudoku/router";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert";
import { Card, CardContent, CardHeader, CardTitle } from "zudoku/ui/Card";
import { Separator } from "zudoku/ui/Separator";

import { FeatureItem } from "../components/FeatureItem";
import { QuotaItem } from "../components/QuotaItem";
import { usePlans } from "../hooks/usePlans";
import { categorizeRateCards } from "../utils/categorizeRateCards";
import { formatDuration } from "../utils/formatDuration";
import { getPriceFromPlan } from "../utils/getPriceFromPlan";

const formatBillingCycle = (duration: string): string => {
  // formatDuration returns: "month", "year", "2 months", "week", "2 weeks", etc.
  if (duration === "month") return "monthly";
  if (duration === "year") return "annually";
  if (duration === "week") return "weekly";
  if (duration === "day") return "daily";
  // For plurals or other durations: "2 months" -> "every 2 months"
  if (duration.includes(" ")) return `every ${duration}`;
  // Fallback for edge cases
  return `every ${duration}`;
};

const CheckoutConfirmPage = ({
  environmentName,
}: {
  environmentName: string;
}) => {
  const [search] = useSearchParams();
  const planId = search.get("plan");
  const auth = useAuth();
  const zudoku = useZudoku();
  const navigate = useNavigate();

  const { data: plans } = usePlans(environmentName);
  const selectedPlan = plans?.items?.find((plan) => plan.id === planId);

  const rateCards = selectedPlan?.phases.at(-1)?.rateCards;
  const { quotas, features } = categorizeRateCards(rateCards ?? []);
  const price = selectedPlan ? getPriceFromPlan(selectedPlan) : null;
  const billingCycle = selectedPlan?.billingCadence
    ? formatDuration(selectedPlan.billingCadence)
    : null;

  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!auth.profile?.email) {
        throw new Error(
          "No email found for user. Make sure your Authentication Provider exposes the email address.",
        );
      }

      const signedRequest = await zudoku.signRequest(
        new Request(
          `https://api.zuploedge.com/v3/zudoku-metering/${environmentName}/subscriptions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              planId,
            }),
          },
        ),
      );

      const response = await fetch(signedRequest);
      const subscription = await response.json();
      if (!response.ok) {
        throw new Error(subscription.message);
      }

      return subscription.id;
    },
    onSuccess: (subscriptionId) => {
      navigate(`/subscriptions/${subscriptionId}`);
    },
    onError: (error) => {
      // biome-ignore lint/suspicious/noConsole: TODO
      console.error("Error creating subscription:", error);
    },
  });

  return (
    <div className="w-full bg-muted min-h-screen flex items-center justify-center px-4 py-12 gap-4">
      <div className="max-w-2xl w-full">
        <div className="flex gap-2 text-muted-foreground text-sm items-center pt-4 pb-4">
          <ArrowLeftIcon className="size-4" />
          Your payment is secured by Stripe
        </div>{" "}
        {createSubscriptionMutation.isError && (
          <Alert className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {createSubscriptionMutation.error.message}
            </AlertDescription>
          </Alert>
        )}
        <Card className="p-8 w-full max-w-7xl">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckIcon className="size-9 text-primary" />
            </div>
          </div>

          {/* Title and Message */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-card-foreground mb-3">
              Review you subscription
            </h1>
            <p className="text-muted-foreground text-base">
              Please confirm the details below before completing your purchase.
            </p>
          </div>

          {/* Plan Details */}
          {selectedPlan && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col text-2xl font-bold bg-primary text-primary-foreground items-center justify-center rounded size-12">
                      {selectedPlan.name.at(0)?.toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold">
                        {selectedPlan.name}
                      </span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {selectedPlan.description || "Selected plan"}
                      </span>
                    </div>
                  </div>
                  {price && price.monthly > 0 && (
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ${price.monthly.toLocaleString()}
                      </div>
                      {billingCycle && (
                        <div className="text-sm text-muted-foreground font-normal">
                          Billed {formatBillingCycle(billingCycle)}
                        </div>
                      )}
                    </div>
                  )}
                  {price && price.monthly === 0 && (
                    <div className="text-2xl text-muted-foreground font-bold">
                      Free
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Separator />
                <div className="text-sm font-medium mb-3 mt-3">
                  What's included:
                </div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  {quotas.map((quota) => (
                    <QuotaItem
                      key={quota.key}
                      quota={quota}
                      className="text-muted-foreground"
                    />
                  ))}
                  {features.map((feature) => (
                    <FeatureItem
                      key={feature.key}
                      feature={feature}
                      className="text-muted-foreground"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 mt-4">
            <Button
              className="w-full"
              onClick={() => createSubscriptionMutation.mutate()}
              disabled={createSubscriptionMutation.isPending}
            >
              {createSubscriptionMutation.isPending
                ? "Processing Payment..."
                : "Confirm & Subscribe"}
            </Button>
            <Button variant="outline" className="w-full" asChild></Button>
          </div>

          {/* Terms */}
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground">
              By confirming, you agree to our Terms of Service and Privacy
              Policy. You can cancel anytime.
            </p>
          </div>
        </Card>
        <div className="flex items-center gap-2 text-muted-foreground text-xs item-center justify-center pt-4">
          <LockIcon className="size-3" />
          Your payment is secured by Stripe
        </div>
      </div>
    </div>
  );
};

export default CheckoutConfirmPage;
