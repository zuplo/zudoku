import type { Plan } from "../types/PlanType";

type PurchaseDetailsTax = {
  currency: string;
  subtotal: number;
  total: number;
  taxAmount: number;
  taxInclusive: boolean;
  taxes: Array<{
    name: string;
    type: string;
    taxType: string;
    jurisdiction: string;
    code: string;
  }>;
  items: Array<{
    amount: number;
    taxAmount: number;
  }>;
};

export type PurchaseDetailsResponse = Plan & { tax?: PurchaseDetailsTax };

export const getPlanFromPurchaseDetails = (
  response: PurchaseDetailsResponse,
) => {
  return response;
};

export const getTaxAmountFromPurchaseDetails = (
  response: PurchaseDetailsResponse,
) => {
  // @note: the first item in the items array represents the monthly charge & tax amount
  const taxAmount = response?.tax?.items[0]?.taxAmount;
  const numericAmount =
    typeof taxAmount === "number"
      ? taxAmount
      : Number.parseFloat(taxAmount ?? "");

  if (!Number.isFinite(numericAmount)) {
    return;
  }

  return numericAmount;
};

export const getTaxLabelFromPurchaseDetails = (
  response: PurchaseDetailsResponse,
) => {
  const taxes = response.tax?.taxes ?? [];
  const hasVatTax = taxes.some((tax) => tax.taxType?.toLowerCase() === "vat");

  return hasVatTax ? "VAT" : "tax";
};

export const isTaxInclusiveFromPurchaseDetails = (
  response: PurchaseDetailsResponse,
) => {
  return response.tax?.taxInclusive === true;
};
