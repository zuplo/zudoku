import { useAuth, useZudoku } from "zudoku/hooks";
import { useSuspenseQuery } from "zudoku/react-query";
import type { Plan } from "../types/PlanType";
import { useDeploymentName } from "./useDeploymentName";

export const usePlans = () => {
  const zudoku = useZudoku();
  const auth = useAuth();
  const deploymentName = useDeploymentName();

  return useSuspenseQuery<{ items: Plan[] }>({
    queryKey: [`/v3/zudoku-metering/${deploymentName}/pricing-page`],
    meta: { context: auth.isAuthenticated ? zudoku : undefined },
  });
};
