import { useZudoku } from "zudoku/hooks";
import { useQuery } from "zudoku/react-query";

/**
 * A usage credit (overage waiver) applied by the API owner that will be applied
 * to the next invoice automatically. Surfaced so the user understands a charge
 * was forgiven (the recorded usage/balance is unchanged).
 */
export type PendingCredit = {
  featureKey: string;
  units: number;
  appliesToInvoiceAt?: string;
  source: string;
};

/** The Zuplo metering pending-credits response. Always an array (`[]` when none). */
export type PendingCreditsResult = {
  pendingCredits: PendingCredit[];
};

/**
 * Fetch the operator-applied usage credits for a subscription, via the Zuplo
 * metering `.../pending-credits` endpoint. Failures are swallowed (`retry: false`,
 * `throwOnError: false`) so the usage page never breaks when credits are
 * unavailable — the credit banner simply isn't shown.
 */
export const usePendingCredits = (
  deploymentName: string,
  subscriptionId: string,
) => {
  const zudoku = useZudoku();

  return useQuery<PendingCreditsResult>({
    queryKey: [
      `/v3/zudoku-metering/${deploymentName}/subscriptions/${subscriptionId}/pending-credits`,
    ],
    meta: { context: zudoku },
    refetchOnWindowFocus: true,
    retry: false,
    throwOnError: false,
  });
};
