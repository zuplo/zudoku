import { useZudoku } from "zudoku/hooks";
import { useSuspenseQuery } from "zudoku/react-query";
import { pricingPageQuery } from "../queries.js";

export const usePlans = () => {
  const zudoku = useZudoku();
  return useSuspenseQuery(pricingPageQuery(zudoku));
};
