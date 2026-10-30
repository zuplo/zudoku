import { useZudoku } from "zudoku/hooks";
import { useMutation } from "zudoku/react-query";
import { useNavigate } from "zudoku/router";
import type { Subscription } from "../types/SubscriptionType.js";
import { queryClient } from "../ZuploMonetizationWrapper";
import { useDeploymentName } from "./useDeploymentName";

/**
 * Confirm a subscription purchase or plan change: POST `{ planId }` to the
 * metering `endpoint`, invalidate cached queries, then navigate to the resulting
 * subscription. Shared by the checkout and plan-change confirmation pages, which
 * differ only by `endpoint` and the optional navigation `state`.
 */
export const useSubscriptionConfirmMutation = ({
  endpoint,
  planId,
  navigateState,
}: {
  /** Path under `/v3/zudoku-metering/{deployment}/`, e.g. `subscriptions`. */
  endpoint: string;
  planId: string;
  /** Optional router state carried to the subscriptions page on success. */
  navigateState?: unknown;
}) => {
  const zudoku = useZudoku();
  const navigate = useNavigate();
  const deploymentName = useDeploymentName();

  return useMutation<Subscription>({
    mutationKey: [`/v3/zudoku-metering/${deploymentName}/${endpoint}`],
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
        navigateState ? { state: navigateState } : undefined,
      );
    },
  });
};
