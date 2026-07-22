import type { ZudokuContext } from "zudoku";
import { queryOptions } from "zudoku/react-query";
import { resolveDeploymentName } from "./deploymentName.js";
import type { SubscriptionsResponse } from "./hooks/useSubscriptions.js";
import type { Plan } from "./types/PlanType.js";

const getDeploymentName = (context: ZudokuContext) =>
  resolveDeploymentName(context.env.ZUPLO_PUBLIC_DEPLOYMENT_NAME);

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
