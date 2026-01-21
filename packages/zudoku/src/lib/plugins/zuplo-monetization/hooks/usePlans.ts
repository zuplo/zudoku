import { useSuspenseQuery } from "zudoku/react-query";

import type { Plan } from "../types/PlanType.js";

export const usePlans = (environmentName: string) => {
  return useSuspenseQuery<{ items: Plan[] }>({
    queryKey: [`/v3/zudoku-metering/${environmentName}/pricing-page`],
  });
};
