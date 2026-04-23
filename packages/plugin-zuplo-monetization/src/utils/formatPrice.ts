export const formatPrice = (amount: number, currency?: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
    trailingZeroDisplay: "stripIfInteger",
  }).format(amount);

/** Amount is in the smallest currency unit (e.g. Stripe); divisor from `Intl` / ISO 4217. */
export const formatMinorCurrencyAmount = (
  amountInMinorUnits: number,
  currency?: string,
) => {
  const code = (currency ?? "USD").toUpperCase();
  const fractionDigits =
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).resolvedOptions().maximumFractionDigits ?? 2;

  const divisor = 10 ** fractionDigits;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amountInMinorUnits / divisor);
};
