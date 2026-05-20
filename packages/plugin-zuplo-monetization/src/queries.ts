import type { ZudokuContext } from "zudoku";
import { queryOptions } from "zudoku/react-query";
import type { SubscriptionsResponse } from "./hooks/useSubscriptions.js";
import type { Plan } from "./types/PlanType.js";

const getDeploymentName = (context: ZudokuContext) => {
  const deploymentName = context.env.ZUPLO_PUBLIC_DEPLOYMENT_NAME;
  if (!deploymentName) {
    throw new Error("ZUPLO_PUBLIC_DEPLOYMENT_NAME is not set");
  }
  return deploymentName;
};

export const pricingPageQuery = (context: ZudokuContext) =>
  queryOptions<{ items: Plan[] }>({
    queryKey: [
      `/v3/zudoku-metering/${getDeploymentName(context)}/pricing-page`,
    ],
    meta: {
      context: context.getAuthState().isAuthenticated ? context : undefined,
    },
  });

export const subscriptionsQuery = (context: ZudokuContext) =>
  queryOptions<SubscriptionsResponse>({
    queryKey: [
      `/v3/zudoku-metering/${getDeploymentName(context)}/subscriptions`,
    ],
    meta: { context },
  });
