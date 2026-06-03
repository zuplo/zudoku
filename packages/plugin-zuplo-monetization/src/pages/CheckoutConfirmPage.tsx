import { LockIcon } from "zudoku/icons";
import { useSearchParams } from "zudoku/router";
import { usePurchaseSummary } from "../hooks/usePurchaseSummary";
import { useSubscriptionConfirmMutation } from "../hooks/useSubscriptionConfirmMutation";
import { useMonetizationConfig } from "../MonetizationContext";
import { ConfirmationScreen } from "./components/ConfirmationScreen.js";
import { PlanSummaryCard } from "./components/PlanSummaryCard.js";

const CheckoutConfirmPage = () => {
  const [search] = useSearchParams();
  const planId = search.get("planId");
  const { pricing } = useMonetizationConfig();

  if (!planId) throw new Error("Parameter `planId` missing");

  const { selectedPlan, taxAmount, taxLabel, taxInclusive } =
    usePurchaseSummary(planId);

  const createSubscriptionMutation = useSubscriptionConfirmMutation({
    endpoint: "subscriptions",
    planId,
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
