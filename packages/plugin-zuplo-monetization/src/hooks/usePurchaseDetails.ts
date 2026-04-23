import { useZudoku } from "zudoku/hooks";
import { useSuspenseQuery } from "zudoku/react-query";
import type { PurchaseDetailsResponse } from "../utils/purchaseDetails";
import { useDeploymentName } from "./useDeploymentName";

export const usePurchaseDetails = (planId: string) => {
  const zudoku = useZudoku();
  const deploymentName = useDeploymentName();

  return useSuspenseQuery<PurchaseDetailsResponse>({
    queryKey: [
      `/v3/zudoku-metering/${deploymentName}/plans/${planId}/purchase-details`,
    ],
    meta: { context: zudoku },
  });
};
