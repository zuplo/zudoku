import type { FlatPrice, Price, RateCard } from "../types/PlanType.js";
import type { Item } from "../types/SubscriptionType.js";
import { categorizeRateCards } from "./categorizeRateCards.js";

const toRateCardPrice = (price: Item["price"]): Price | null => {
  if (!price) return null;

  if (price.type === "tiered" && price.tiers) {
    return {
      type: "tiered",
      mode: price.mode === "volume" ? "volume" : "graduated",
      tiers: price.tiers.map((t) => ({
        upToAmount: t.upToAmount,
        flatPrice: t.flatPrice ? { amount: t.flatPrice.amount } : undefined,
        unitPrice: t.unitPrice ? { amount: t.unitPrice.amount } : undefined,
      })),
    };
  }
  if (price.type === "unit" && price.amount != null) {
    return { type: "unit", amount: price.amount };
  }
  if (price.type === "flat" && price.amount != null) {
    return {
      type: "flat",
      amount: price.amount,
      paymentTerm:
        price.paymentTerm === "in_advance" || price.paymentTerm === "in_arrears"
          ? price.paymentTerm
          : undefined,
    };
  }
  return null;
};

const flatOrNull = (price: Price | null): FlatPrice | null =>
  price?.type === "flat" ? price : null;

/**
 * Convert an actual provisioned subscription line item into the `RateCard`
 * shape so it can run through the same {@link categorizeRateCards} logic the
 * pricing card uses. This is the key to showing a subscription's *real*
 * included quota (e.g. `10 / hour`) — the catalog plan reports `0` for a
 * priced first tier, but the subscription item carries the true
 * `issueAfterReset`.
 */
const itemToRateCard = (item: Item): RateCard => {
  const ent = item.included?.entitlement;
  const name =
    item.name ?? item.included?.feature?.name ?? item.featureKey ?? item.key;
  const base = { key: item.key, name, featureKey: item.featureKey };
  const price = toRateCardPrice(item.price);
  const billingCadence =
    item.billingCadence ?? ent?.usagePeriod?.intervalISO ?? null;

  if (ent?.type === "metered") {
    return {
      ...base,
      type: "usage_based",
      billingCadence: billingCadence ?? "P1M",
      price,
      entitlementTemplate: {
        type: "metered",
        isSoftLimit: ent.isSoftLimit,
        issueAfterReset: ent.issueAfterReset,
        usagePeriod: ent.usagePeriod?.intervalISO,
      },
    };
  }
  if (ent?.type === "boolean") {
    return {
      ...base,
      type: "flat_fee",
      billingCadence,
      price: flatOrNull(price),
      entitlementTemplate: { type: "boolean" },
    };
  }
  if (ent?.type === "static") {
    return {
      ...base,
      type: "flat_fee",
      billingCadence,
      price: flatOrNull(price),
      entitlementTemplate: { type: "static", config: ent.config ?? "" },
    };
  }

  // No entitlement → a pure recurring fee (e.g. monthly_fee). It has no
  // entitlement template, so categorizeRateCards omits it from the included
  // list (its cost is reflected in the headline price instead).
  return {
    ...base,
    type: "flat_fee",
    billingCadence,
    price: flatOrNull(price),
  };
};

/**
 * Categorize a subscription phase's actual items into `{ quotas, features }`,
 * reusing {@link categorizeRateCards} so the subscription view stays
 * consistent with the pricing card.
 */
export const categorizeSubscriptionItems = (
  items: Item[],
  options?: { currency?: string; units?: Record<string, string> },
) => categorizeRateCards(items.map(itemToRateCard), options);
