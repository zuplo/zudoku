import { useZudoku } from "zudoku/hooks";
import { useQuery } from "zudoku/react-query";
import { useDeploymentName } from "./useDeploymentName";

/**
 * Timing for the change-credit estimate. Mirrors the backend's rule
 * (upgrade → immediate, downgrade → next billing cycle) so the previewed
 * credit matches what the change will actually do.
 */
export type ChangeTiming = "immediate" | "next_billing_cycle";

/**
 * The Zuplo metering `SubscriptionChangeCreditEstimate`. Numeric fields
 * serialize as strings (a `Numeric` type); other fields exist but aren't used
 * here.
 */
export type ChangeCreditEstimate = {
  creditAmount?: string;
  currency?: string;
};

/**
 * Preview the proration credit for changing a subscription's plan, via the
 * Zuplo metering `.../change/estimate-credit` endpoint. Failures are swallowed
 * (`retry: false`, `throwOnError: false`) so the confirmation page never breaks
 * when the preview is unavailable.
 */
export const useChangeCreditEstimate = (
  subscriptionId: string,
  timing: ChangeTiming,
) => {
  const zudoku = useZudoku();
  const deploymentName = useDeploymentName();

  return useQuery<ChangeCreditEstimate>({
    queryKey: [
      `/v3/zudoku-metering/${deploymentName}/subscriptions/${subscriptionId}/change/estimate-credit`,
      timing,
    ],
    meta: {
      context: zudoku,
      request: { method: "POST", body: JSON.stringify({ timing }) },
    },
    retry: false,
    throwOnError: false,
  });
};

/**
 * Extract a positive credit amount from the estimate, or `undefined` when there
 * isn't a usable one (so the UI only shows a credit when there actually is one).
 */
export const getEstimatedCreditAmount = (
  estimate: ChangeCreditEstimate | undefined,
): { amount: number; currency?: string } | undefined => {
  if (!estimate) return undefined;
  const amount = Number.parseFloat(estimate.creditAmount ?? "");
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return { amount, currency: estimate.currency };
};
