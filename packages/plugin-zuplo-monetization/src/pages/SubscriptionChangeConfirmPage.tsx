import { Button } from "zudoku/components";
import { useZudoku } from "zudoku/hooks";
import { CheckIcon } from "zudoku/icons";
import { useMutation } from "zudoku/react-query";
import { Link, useNavigate, useSearchParams } from "zudoku/router";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert";
import { Card, CardContent, CardHeader, CardTitle } from "zudoku/ui/Card";
import { Separator } from "zudoku/ui/Separator";
import { FeatureItem } from "../components/FeatureItem";
import { QuotaItem } from "../components/QuotaItem";
import { useDeploymentName } from "../hooks/useDeploymentName";
import { usePurchaseDetails } from "../hooks/usePurchaseDetails";
import type { Subscription } from "../hooks/useSubscriptions";
import { useMonetizationConfig } from "../MonetizationContext";
import { categorizeRateCards } from "../utils/categorizeRateCards";
import { formatBillingCycle } from "../utils/formatBillingCycle";
import { formatDuration } from "../utils/formatDuration";
import { formatPrice } from "../utils/formatPrice";
import { getPriceFromPlan } from "../utils/getPriceFromPlan";
import {
  getPlanFromPurchaseDetails,
  getTaxAmountFromPurchaseDetails,
} from "../utils/purchaseDetails";
import { queryClient } from "../ZuploMonetizationWrapper";

const SubscriptionChangeConfirmPage = () => {
  const [search] = useSearchParams();
  const planId = search.get("planId");
  const subscriptionId = search.get("subscriptionId");
  const mode = search.get("mode");
  const zudoku = useZudoku();
  const deploymentName = useDeploymentName();
  const navigate = useNavigate();
  const { pricing } = useMonetizationConfig();

  if (!planId) throw new Error("Parameter `planId` missing");
  if (!subscriptionId) throw new Error("Parameter `subscriptionId` missing");

  const purchaseDetails = usePurchaseDetails(planId);

  const selectedPlan = getPlanFromPurchaseDetails(purchaseDetails.data);
  const taxAmount = getTaxAmountFromPurchaseDetails(purchaseDetails.data);
  const rateCards = selectedPlan?.phases.at(-1)?.rateCards;
  const { quotas, features } = categorizeRateCards(rateCards ?? [], {
    currency: selectedPlan?.currency,
    units: pricing?.units,
    planBillingCadence: selectedPlan?.billingCadence,
  });
  const price = selectedPlan ? getPriceFromPlan(selectedPlan) : null;
  const billingCycle = selectedPlan?.billingCadence
    ? formatDuration(selectedPlan.billingCadence)
    : null;
  const effectiveChangeMessage =
    mode === "downgrade"
      ? "This change will take effect at the start of your next billing cycle."
      : "This change will take effect immediately.";

  const changeMutation = useMutation<Subscription>({
    mutationKey: [
      `/v3/zudoku-metering/${deploymentName}/subscriptions/${subscriptionId}/change`,
    ],
    meta: {
      context: zudoku,
      request: {
        method: "POST",
        body: JSON.stringify({ planId }),
      },
    },
    onSuccess: async (subscription) => {
      await queryClient.invalidateQueries();
      navigate(
        `/subscriptions?subscriptionId=${encodeURIComponent(subscription.id)}`,
        { state: { planSwitched: { newPlanName: selectedPlan?.name } } },
      );
    },
  });

  return (
    <div className="w-full bg-muted min-h-screen flex items-center justify-center px-4 py-12 gap-4">
      <div className="max-w-2xl w-full">
        {changeMutation.isError && (
          <Alert className="mb-4" variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{changeMutation.error.message}</AlertDescription>
          </Alert>
        )}
        <Card className="p-8 w-full max-w-7xl">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckIcon className="size-9 text-primary" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-card-foreground mb-3">
              Confirm plan change
            </h1>
            <p className="text-muted-foreground text-base">{effectiveChangeMessage}</p>
            <p className="text-muted-foreground text-base">
              Please confirm the details below to change your subscription.
            </p>
          </div>

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
                        {selectedPlan.description || "New plan"}
                      </span>
                    </div>
                  </div>
                  {price && price.monthly > 0 && (
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatPrice(price.monthly, selectedPlan?.currency)}
                      </div>
                      {billingCycle && (
                        <div className="text-sm text-muted-foreground font-normal">
                          Billed {formatBillingCycle(billingCycle)}
                        </div>
                      )}
                      {taxAmount != null && (
                        <div className="text-xs text-muted-foreground font-normal mt-1">
                          + {formatPrice(taxAmount, selectedPlan?.currency)} VAT
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

          <div className="space-y-3 mt-4">
            <Button
              className="w-full"
              onClick={() => changeMutation.mutate()}
              disabled={changeMutation.isPending}
            >
              {changeMutation.isPending
                ? "Changing plan..."
                : "Confirm & Change Plan"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              disabled={changeMutation.isPending}
              asChild={!changeMutation.isPending}
            >
              <Link
                to={`/subscriptions?${new URLSearchParams({ subscriptionId: subscriptionId ?? "" })}`}
              >
                Cancel
              </Link>
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground">
              By confirming, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionChangeConfirmPage;
