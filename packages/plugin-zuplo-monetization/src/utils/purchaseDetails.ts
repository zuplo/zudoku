import type { Plan } from "../types/PlanType";

type PurchaseDetailsTax = {
  amount?: string | number;
};

export type PurchaseDetailsResponse =
  | (Plan & { tax?: PurchaseDetailsTax })
  | { plan: Plan; tax?: PurchaseDetailsTax };

export const getPlanFromPurchaseDetails = (
  response: PurchaseDetailsResponse,
) => {
  return "plan" in response ? response.plan : response;
};

export const getTaxAmountFromPurchaseDetails = (
  response: PurchaseDetailsResponse,
) => {
  const taxAmount = response?.tax?.amount;
  const numericAmount =
    typeof taxAmount === "number"
      ? taxAmount
      : Number.parseFloat(taxAmount ?? "");

  if (!Number.isFinite(numericAmount)) {
    return;
  }

  return numericAmount;
};
