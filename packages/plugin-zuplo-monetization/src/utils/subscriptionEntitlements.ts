import type {
  Feature,
  FlatPrice,
  PlanPhase,
  Price,
  Quota,
  RateCard,
} from "../types/PlanType.js";
import type { Item, Subscription } from "../types/SubscriptionType.js";
import { getActivePhase } from "./billables.js";
import { categorizeRateCards } from "./categorizeRateCards.js";
import { formatPlanPrice, type PlanPriceLabel } from "./formatPlanPrice.js";

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

/** Map a subscription phase's items to rate cards (for price/entitlement derivation). */
export const subscriptionItemsToRateCards = (items: Item[]): RateCard[] =>
  items.map(itemToRateCard);

export type SubscriptionPlanView = {
  /** Headline price for the subscription. */
  priceLabel: PlanPriceLabel;
  /** Entitlements derived from the active phase's provisioned items. */
  entitlements: { quotas: Quota[]; features: Feature[] };
  /** Catalog plan phases to render when there are no provisioned items. */
  fallbackPhases: PlanPhase[];
  /** Whether the view is sourced from the subscription's actual items. */
  usingItems: boolean;
};

/**
 * Resolve a subscription's headline price and entitlements, preferring the
 * active phase's ACTUAL provisioned items (the authoritative source — real
 * included quotas and recurring fees) and falling back to the catalog plan's
 * rate cards only when items aren't populated. Keeping both the price and the
 * entitlements on the same source avoids showing "Free" for a paid plan whose
 * embedded snapshot is incomplete.
 */
export const getSubscriptionPlanView = (
  subscription: Subscription,
  options?: { units?: Record<string, string> },
): SubscriptionPlanView => {
  const plan = subscription.plan;
  const currency = subscription.currency ?? plan.currency;
  const billingCadence = subscription.billingCadence ?? plan.billingCadence;
  const items = getActivePhase(subscription)?.items ?? [];

  if (items.length > 0) {
    const rateCards = subscriptionItemsToRateCards(items);
    return {
      priceLabel: formatPlanPrice({
        ...plan,
        billingCadence,
        phases: [{ key: "active", name: "Active", rateCards }],
      }),
      entitlements: categorizeRateCards(rateCards, {
        currency,
        units: options?.units,
        planBillingCadence: billingCadence,
      }),
      fallbackPhases: [],
      usingItems: true,
    };
  }

  return {
    priceLabel: formatPlanPrice(plan),
    entitlements: { quotas: [], features: [] },
    fallbackPhases: plan.phases ?? [],
    usingItems: false,
  };
};

/** Whether a resolved view has any entitlements to render. */
export const hasSubscriptionEntitlements = (
  view: SubscriptionPlanView,
): boolean =>
  view.usingItems
    ? view.entitlements.quotas.length > 0 ||
      view.entitlements.features.length > 0
    : view.fallbackPhases.some((p) =>
        p.rateCards?.some((rc) => rc.entitlementTemplate),
      );
