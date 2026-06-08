import {
  getPlanFromPurchaseDetails,
  getTaxAmountFromPurchaseDetails,
  getTaxLabelFromPurchaseDetails,
  isTaxInclusiveFromPurchaseDetails,
} from "../utils/purchaseDetails";
import { usePurchaseDetails } from "./usePurchaseDetails";

/**
 * Resolve a plan's checkout summary — the selected plan plus its tax preview —
 * from the purchase-details endpoint. Shared by the checkout and plan-change
 * confirmation pages so both read the plan and tax the same way.
 */
export const usePurchaseSummary = (planId: string) => {
  const { data } = usePurchaseDetails(planId);
  return {
    selectedPlan: getPlanFromPurchaseDetails(data),
    taxAmount: getTaxAmountFromPurchaseDetails(data),
    taxLabel: getTaxLabelFromPurchaseDetails(data),
    taxInclusive: isTaxInclusiveFromPurchaseDetails(data),
  };
};
