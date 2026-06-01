import { useZudoku } from "zudoku/hooks";
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
  const taxLabel = getTaxLabelFromPurchaseDetails(purchaseDetails.data);
  const taxInclusive = isTaxInclusiveFromPurchaseDetails(purchaseDetails.data);
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
    <ConfirmationScreen
      title="Confirm plan change"
      message={
        <>
          <p className="text-muted-foreground text-base">
            {effectiveChangeMessage}
          </p>
          <p className="text-muted-foreground text-base">
            Please confirm the details below to change your subscription.
          </p>
        </>
      }
      errorMessage={
        changeMutation.isError ? changeMutation.error.message : undefined
      }
      confirmLabel="Confirm & Change Plan"
      pendingLabel="Changing plan..."
      onConfirm={() => changeMutation.mutate()}
      isPending={changeMutation.isPending}
      cancelTo={`/subscriptions?${new URLSearchParams({ subscriptionId })}`}
      termsNote="By confirming, you agree to our Terms of Service and Privacy Policy."
    >
      {selectedPlan && (
        <PlanSummaryCard
          plan={selectedPlan}
          descriptionFallback="New plan"
          taxAmount={taxAmount}
          taxLabel={taxLabel}
          taxInclusive={taxInclusive}
          units={pricing?.units}
        />
      )}
    </ConfirmationScreen>
  );
};

export default SubscriptionChangeConfirmPage;
