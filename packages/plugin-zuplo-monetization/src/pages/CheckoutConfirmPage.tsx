import { useZudoku } from "zudoku/hooks";
import { LockIcon } from "zudoku/icons";
import { useMutation } from "zudoku/react-query";
import { useNavigate, useSearchParams } from "zudoku/router";
import { useDeploymentName } from "../hooks/useDeploymentName";
import { usePurchaseDetails } from "../hooks/usePurchaseDetails";
import { useMonetizationConfig } from "../MonetizationContext";
import type { Subscription } from "../types/SubscriptionType.js";
import {
  getPlanFromPurchaseDetails,
  getTaxAmountFromPurchaseDetails,
  getTaxLabelFromPurchaseDetails,
  isTaxInclusiveFromPurchaseDetails,
} from "../utils/purchaseDetails";
import { queryClient } from "../ZuploMonetizationWrapper";
import { ConfirmationScreen } from "./components/ConfirmationScreen.js";
import { PlanSummaryCard } from "./components/PlanSummaryCard.js";

const CheckoutConfirmPage = () => {
  const [search] = useSearchParams();
  const planId = search.get("planId");
  const zudoku = useZudoku();
  const deploymentName = useDeploymentName();
  const navigate = useNavigate();
  const { pricing } = useMonetizationConfig();

  if (!planId) throw new Error("Parameter `planId` missing");

  const purchaseDetails = usePurchaseDetails(planId);

  const selectedPlan = getPlanFromPurchaseDetails(purchaseDetails.data);
  const taxAmount = getTaxAmountFromPurchaseDetails(purchaseDetails.data);
  const taxLabel = getTaxLabelFromPurchaseDetails(purchaseDetails.data);
  const taxInclusive = isTaxInclusiveFromPurchaseDetails(purchaseDetails.data);

  const createSubscriptionMutation = useMutation<Subscription>({
    mutationKey: [`/v3/zudoku-metering/${deploymentName}/subscriptions`],
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
      );
    },
  });

  return (
    <ConfirmationScreen
      title="Review your subscription"
      message={
        <p className="text-muted-foreground text-base">
          Please confirm the details below before completing your purchase.
        </p>
      }
      errorMessage={
        createSubscriptionMutation.isError
          ? createSubscriptionMutation.error.message
          : undefined
      }
      confirmLabel="Confirm & Subscribe"
      pendingLabel="Processing Payment..."
      onConfirm={() => createSubscriptionMutation.mutate()}
      isPending={createSubscriptionMutation.isPending}
      confirmDisabled={!selectedPlan}
      cancelTo="/pricing"
      termsNote="By confirming, you agree to our Terms of Service and Privacy Policy. You can cancel anytime."
      footer={
        <div className="flex items-center gap-2 text-muted-foreground text-xs item-center justify-center pt-4">
          <LockIcon className="size-3" />
          Your payment is secured by Stripe
        </div>
      }
    >
      {selectedPlan && (
        <PlanSummaryCard
          plan={selectedPlan}
          descriptionFallback="Selected plan"
          taxAmount={taxAmount}
          taxLabel={taxLabel}
          taxInclusive={taxInclusive}
          units={pricing?.units}
          entitlementsItemClassName="text-muted-foreground"
        />
      )}
    </ConfirmationScreen>
  );
};

export default CheckoutConfirmPage;
