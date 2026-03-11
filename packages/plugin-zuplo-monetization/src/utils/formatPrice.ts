export const formatPrice = (amount: number, currency?: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
    trailingZeroDisplay: "stripIfInteger",
  }).format(amount);
