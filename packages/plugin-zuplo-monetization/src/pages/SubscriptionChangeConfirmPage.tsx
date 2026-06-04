import { useZudoku } from "zudoku/hooks";
import { ArrowDownIcon } from "zudoku/icons";
import { useQuery } from "zudoku/react-query";
import { useSearchParams } from "zudoku/router";
import {
  getEstimatedCreditAmount,
  useChangeCreditEstimate,
} from "../hooks/useChangeCreditEstimate";
import { usePurchaseSummary } from "../hooks/usePurchaseSummary";
import { useSubscriptionConfirmMutation } from "../hooks/useSubscriptionConfirmMutation";
import { useMonetizationConfig } from "../MonetizationContext";
import { subscriptionsQuery } from "../queries.js";
import { formatDateTime } from "../utils/formatDateTime.js";
import { formatPrice } from "../utils/formatPrice.js";
import { ConfirmationScreen } from "./components/ConfirmationScreen.js";
import { CurrentPlanBaseline } from "./components/CurrentPlanBaseline.js";
import { PlanSummaryCard } from "./components/PlanSummaryCard.js";

const SubscriptionChangeConfirmPage = () => {
  const [search] = useSearchParams();
  const planId = search.get("planId");
  const subscriptionId = search.get("subscriptionId");
  const mode = search.get("mode");
  const zudoku = useZudoku();
  const { pricing } = useMonetizationConfig();

  if (!planId) throw new Error("Parameter `planId` missing");
  if (!subscriptionId) throw new Error("Parameter `subscriptionId` missing");

  const { selectedPlan, taxAmount, taxLabel, taxInclusive } =
    usePurchaseSummary(planId);

  // The current (pre-change) subscription, for the from→to comparison and the
  // concrete next-billing-cycle date. Best-effort: the confirm action does not
  // depend on it.
  const { data: subscriptionsData } = useQuery(subscriptionsQuery(zudoku));
  const currentSubscription = subscriptionsData?.items.find(
    (s) => s.id === subscriptionId,
  );

  const isDowngrade = mode === "downgrade";
  const creditEstimate = useChangeCreditEstimate(
    subscriptionId,
    isDowngrade ? "next_billing_cycle" : "immediate",
  );
  const credit = getEstimatedCreditAmount(creditEstimate.data);

  const nextCycleEnd =
    currentSubscription?.alignment?.currentAlignedBillingPeriod?.to;
  const effectiveText = isDowngrade
    ? nextCycleEnd
      ? `Takes effect ${formatDateTime(nextCycleEnd)}, at the start of your next billing cycle`
      : "Takes effect at the start of your next billing cycle"
    : "Takes effect immediately";

  const changeMutation = useSubscriptionConfirmMutation({
    endpoint: `subscriptions/${subscriptionId}/change`,
    planId,
    navigateState: { planSwitched: { newPlanName: selectedPlan?.name } },
  });

  return (
    <ConfirmationScreen
      title="Confirm plan change"
      message={
        <p className="text-muted-foreground text-base">
          Review the change below before confirming.
        </p>
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
      <div className="space-y-3">
        {currentSubscription && (
          <>
            <CurrentPlanBaseline
              subscription={currentSubscription}
              units={pricing?.units}
            />
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <ArrowDownIcon className="size-4" /> Changing to
            </div>
          </>
        )}

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

        <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
          <div className="font-medium text-card-foreground">
            {effectiveText}
          </div>
          {credit && (
            <div className="text-muted-foreground">
              You'll be credited {formatPrice(credit.amount, credit.currency)}{" "}
              for unused time on your current plan.
            </div>
          )}
        </div>
      </div>
    </ConfirmationScreen>
  );
};

export default SubscriptionChangeConfirmPage;
