import { useZudoku } from "zudoku/hooks";
import { useQuery } from "zudoku/react-query";
import { useDeploymentName } from "./useDeploymentName";

/**
 * Proration/credit preview for a pending plan change, via gateway-service's
 * `.../change/estimate-credit` (an OpenMeter pass-through). The response shape
 * is NOT typed by the gateway — these fields are best-effort and MUST be
 * verified against a live response before relying on the rendered amount.
 * Failures are swallowed (`retry: false`, `throwOnError: false`) so the
 * confirmation page never breaks when the preview is unavailable.
 */
export type ChangeCreditEstimate = {
  credit?: { amount?: string | number; currency?: string };
  amount?: string | number;
  currency?: string;
};

export const useChangeCreditEstimate = (
  subscriptionId: string,
  planId: string,
) => {
  const zudoku = useZudoku();
  const deploymentName = useDeploymentName();

  return useQuery<ChangeCreditEstimate>({
    queryKey: [
      `/v3/zudoku-metering/${deploymentName}/subscriptions/${subscriptionId}/change/estimate-credit`,
      planId,
    ],
    meta: {
      context: zudoku,
      request: { method: "POST", body: JSON.stringify({ planId }) },
    },
    retry: false,
    throwOnError: false,
  });
};

/**
 * Extract a positive credit amount (major currency units) from the best-effort
 * estimate shape. Returns `undefined` when nothing recognizable is present, so
 * the UI shows the credit only when we actually have one.
 */
export const getEstimatedCreditAmount = (
  estimate: ChangeCreditEstimate | undefined,
): { amount: number; currency?: string } | undefined => {
  if (!estimate) return undefined;
  const raw = estimate.credit?.amount ?? estimate.amount;
  const amount = typeof raw === "string" ? Number.parseFloat(raw) : raw;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }
  return { amount, currency: estimate.credit?.currency ?? estimate.currency };
};
