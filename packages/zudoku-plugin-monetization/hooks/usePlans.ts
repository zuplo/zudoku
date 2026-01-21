import { useZudoku } from "zudoku/hooks";
import { useSuspenseQuery } from "zudoku/react-query";

import { Plan } from "../types/PlanType";

export const usePlans = (environmentName: string) => {
  const zudoku = useZudoku();

  return useSuspenseQuery<{ items: Plan[] }>({
    queryKey: [`/v3/zudoku-metering/${environmentName}/pricing-page`],
    meta: {},
  });
};
