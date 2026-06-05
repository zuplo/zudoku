import type {
  Feature,
  FlatPrice,
  MeteredEntitlementTemplate,
  Plan,
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
    const entitlementTemplate: MeteredEntitlementTemplate = {
      type: "metered",
      isSoftLimit: ent.isSoftLimit,
      issueAfterReset: ent.issueAfterReset,
      usagePeriod: ent.usagePeriod?.intervalISO,
    };
    // A flat recurring price on a metered item is a fixed subscription fee
    // that bundles an included quota (e.g. "$2.99/hour for 10 requests/hour"),
    // not pay-as-you-go. Mirror how the catalog plan authors this — a
    // `flat_fee` rate card carrying a metered entitlement template — so the fee
    // counts toward the headline price (`getPlanPrice` only sums `flat_fee`
    // cards) instead of flipping the plan to "Pay as you go". Tiered/unit (or
    // absent) prices stay `usage_based`: that's true metered billing, which
    // `formatPlanPrice`/`categorizeRateCards` already render correctly.
    if (price?.type === "flat") {
      return {
        ...base,
        type: "flat_fee",
        billingCadence,
        price,
        entitlementTemplate,
      };
    }
    return {
      ...base,
      type: "usage_based",
      billingCadence: billingCadence ?? "P1M",
      price,
      entitlementTemplate,
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
  /**
   * The cadence the price/entitlements were resolved against
   * (`subscription.billingCadence`, falling back to the plan's). Render the
   * price suffix and any cadence-dependent period with this — not the embedded
   * `plan.billingCadence`, which can disagree with the subscription — so the
   * amount and its `/interval` always come from the same source.
   */
  billingCadence?: string;
  /** The currency the price/entitlements were resolved against. */
  currency?: string;
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
      billingCadence,
      currency,
    };
  }

  return {
    priceLabel: formatPlanPrice(plan),
    entitlements: { quotas: [], features: [] },
    fallbackPhases: plan.phases ?? [],
    usingItems: false,
    billingCadence,
    currency,
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

export type SubscriptionPhaseStatus = "past" | "current" | "future";

/** A single subscription phase resolved to its price + entitlements + timing. */
export type SubscriptionPhaseView = {
  id: string;
  name: string;
  status: SubscriptionPhaseStatus;
  activeFrom: string;
  activeTo?: string;
  priceLabel: PlanPriceLabel;
  entitlements: { quotas: Quota[]; features: Feature[] };
  billingCadence?: string;
  currency?: string;
};

const phaseStatus = (
  phase: { activeFrom: string; activeTo?: string },
  now: number,
): SubscriptionPhaseStatus => {
  if (phase.activeTo && new Date(phase.activeTo).getTime() < now) return "past";
  if (new Date(phase.activeFrom).getTime() > now) return "future";
  return "current";
};

/**
 * Rate cards for one subscription phase: its own provisioned items (the
 * authoritative quotas/fees), falling back to the catalog plan phase with the
 * same `key` when a phase (typically a future one) hasn't been provisioned yet.
 */
const phaseRateCards = (
  plan: Subscription["plan"],
  phase: Subscription["phases"][number],
): RateCard[] =>
  phase.items.length > 0
    ? subscriptionItemsToRateCards(phase.items)
    : (plan.phases?.find((p) => p.key === phase.key)?.rateCards ?? []);

const phasesByActiveFrom = (subscription: Subscription) =>
  [...subscription.phases].sort(
    (a, b) =>
      new Date(a.activeFrom).getTime() - new Date(b.activeFrom).getTime(),
  );

/**
 * Resolve EVERY phase of a subscription (not just the active one) to a
 * {@link SubscriptionPhaseView}, ordered by `activeFrom` and tagged
 * past/current/future. Generalizes {@link getSubscriptionPlanView}: each phase's
 * price and entitlements come from its own provisioned items (the authoritative
 * source), falling back to the catalog plan phase with the same `key` when a
 * phase (typically a future one) hasn't been provisioned yet. Powers the
 * subscription details page's current + upcoming + previous phase timeline.
 */
export const getSubscriptionPhaseViews = (
  subscription: Subscription,
  options?: { units?: Record<string, string> },
): SubscriptionPhaseView[] => {
  const plan = subscription.plan;
  const currency = subscription.currency ?? plan.currency;
  const billingCadence = subscription.billingCadence ?? plan.billingCadence;
  const now = Date.now();

  return phasesByActiveFrom(subscription).map((phase) => {
    const rateCards = phaseRateCards(plan, phase);

    return {
      id: phase.id,
      name: phase.name,
      status: phaseStatus(phase, now),
      activeFrom: phase.activeFrom,
      activeTo: phase.activeTo,
      priceLabel: formatPlanPrice({
        ...plan,
        billingCadence,
        phases: [{ key: phase.key, name: phase.name, rateCards }],
      }),
      entitlements: categorizeRateCards(rateCards, {
        currency,
        units: options?.units,
        planBillingCadence: billingCadence,
      }),
      billingCadence,
      currency,
    };
  });
};

/**
 * Build a catalog-shaped {@link Plan} from a subscription's *own* current and
 * future phases (past phases dropped), so the plan-change confirmation page can
 * render the current subscription with the exact same pricing-table card
 * ({@link formatPlanPrice} / `getPlanPriceSchedule` / `PlanEntitlements`) used
 * for the new plan. Each phase's rate cards come from its provisioned items
 * (the authoritative source) — the embedded `subscription.plan` snapshot is
 * unreliable here (it can arrive with `phases: []`), so we never read its
 * phases for pricing.
 */
export const subscriptionToCurrentPlan = (subscription: Subscription): Plan => {
  const plan = subscription.plan;
  const now = Date.now();
  const phases = phasesByActiveFrom(subscription)
    .filter((p) => !(p.activeTo && new Date(p.activeTo).getTime() < now))
    .map((phase) => ({
      key: phase.key,
      name: phase.name,
      rateCards: phaseRateCards(plan, phase),
    }));

  return {
    ...plan,
    currency: subscription.currency ?? plan.currency,
    billingCadence: subscription.billingCadence ?? plan.billingCadence,
    phases,
  };
};
