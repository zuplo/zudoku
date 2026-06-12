import type { Item } from "../../types/SubscriptionType.js";
import { priceIncludedUnits } from "../../utils/priceIncludedUnits.js";

/** The metered access values the usage endpoint reports for one feature. */
export type MeteredValue = {
  balance: number;
  usage: number;
  overage: number;
};

/**
 * What the Usage card renders for one metered feature, derived in one place so
 * the component stays a dumb renderer and every entitlement/price
 * configuration is table-testable:
 *
 * - `capped` — a hard limit genuinely blocks at the quota. Enforcement is
 *   price-independent, so this wins over any price shape.
 * - `included` — a soft quota backed by a genuinely free pricing range:
 *   "included" is a statement about money, not just a counter.
 * - `payAsYouGo` — a soft limit on a price that provably bills from the first
 *   call (unit, or graduated tiers with no free range): quota math is
 *   meaningless, show plain consumption.
 * - `meteredGeneric` — everything else (track-only quotas, flat/unpriced
 *   items, volume/package/dynamic shapes, missing item data): show consumption
 *   without billing claims the price data can't support.
 */
export type UsageView =
  | {
      kind: "capped";
      usage: number;
      quota: number;
      remaining: number;
      atLimit: boolean;
      rateLabel?: string;
    }
  | {
      kind: "included";
      usage: number;
      included: number;
      remaining: number;
      overage: number;
      rateLabel?: string;
    }
  | { kind: "payAsYouGo"; usage: number; caption: string; rateLabel?: string }
  | {
      kind: "meteredGeneric";
      usage: number;
      quota?: number;
      caption: string;
      rateLabel?: string;
    };

const formatAmount = (amount: string | undefined): string | undefined => {
  const value = parseFloat(amount ?? "");
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : undefined;
};

// The unit name comes from the pricing config (`pricing.units` keyed by rate
// card or feature key); "unit" is the configured fallback everywhere else in
// the plugin (see categorizeRateCards), so it is here too.
const pluralizeUnit = (unitName: string) =>
  unitName.endsWith("s") ? unitName : `${unitName}s`;

/** The label for what additional usage costs, when the shape has one number. */
const rateLabelFor = (
  price: Item["price"],
  unitName: string,
): string | undefined => {
  if (!price) return undefined;
  if (price.type === "unit") {
    const amount = formatAmount(price.amount);
    return amount ? `${amount}/${unitName}` : undefined;
  }
  if (price.type === "tiered") {
    const overageTier =
      price.tiers?.find((t) => !t.upToAmount) ?? price.tiers?.at(-1);
    const amount = formatAmount(overageTier?.unitPrice?.amount);
    return amount ? `${amount}/${unitName}` : undefined;
  }
  if (price.type === "package") {
    const amount = formatAmount(price.amount);
    if (!amount) return undefined;
    const size = parseFloat(price.quantityPerUnit ?? "");
    return Number.isFinite(size) && size > 0
      ? `${amount} per ${size.toLocaleString()} ${pluralizeUnit(unitName)}`
      : amount;
  }
  // flat: no per-usage rate; volume/dynamic: not representable as one number.
  return undefined;
};

const NO_CAP = "There is no usage cap.";

export const deriveUsageView = (
  meter: MeteredValue,
  item?: Item,
  unitName = "unit",
): UsageView => {
  const quota = meter.balance + meter.usage - meter.overage;
  const isSoftLimit = item?.included?.entitlement?.isSoftLimit ?? true;
  const rateLabel = rateLabelFor(item?.price, unitName);

  // A hard limit blocks at the quota no matter how usage is priced.
  if (!isSoftLimit) {
    return {
      kind: "capped",
      usage: meter.usage,
      quota,
      remaining: meter.balance,
      atLimit: meter.usage >= quota,
      rateLabel,
    };
  }

  // No item data (e.g. the feature isn't part of the current phase): the
  // access values are all we have, so make no billing claims — we know
  // neither the price nor whether the quota actually caps anything.
  if (!item) {
    return {
      kind: "meteredGeneric",
      usage: meter.usage,
      quota: quota > 0 ? quota : undefined,
      caption: "Usage is billed per your plan's pricing.",
    };
  }

  // Flat-priced or unpriced items: usage is tracked but never billed per
  // call, so an "additional usage is billed" framing would be false.
  if (!item.price || item.price.type === "flat") {
    return {
      kind: "meteredGeneric",
      usage: meter.usage,
      quota: quota > 0 ? quota : undefined,
      caption: `Usage doesn't change your bill. ${NO_CAP}`,
    };
  }

  const isGraduated =
    item.price.type === "tiered" &&
    (item.price.mode ?? "graduated") === "graduated";
  // freeUnits is only a trustworthy billing statement for the shapes the
  // derivation understands; for the rest it is merely a conservative 0.
  const derivable = item.price.type === "unit" || isGraduated;
  const freeUnits = priceIncludedUnits(item.price);

  if (derivable) {
    if (freeUnits === 0) {
      return {
        kind: "payAsYouGo",
        usage: meter.usage,
        caption: `Pay as you go — every ${unitName} is billed; there is no usage cap.`,
        rateLabel,
      };
    }
    // A price that never charges per unit ($0 unit price, or graduated tiers
    // free through the last tier): quota framing — and especially the
    // "additional usage is billed" overage warning — would be false, with or
    // without an issued quota.
    if (freeUnits === Number.POSITIVE_INFINITY) {
      return {
        kind: "meteredGeneric",
        usage: meter.usage,
        quota: quota > 0 ? quota : undefined,
        caption: `Included with your plan. ${NO_CAP}`,
        rateLabel,
      };
    }
    if (quota > 0) {
      // The quota mirrors a genuinely free pricing range.
      return {
        kind: "included",
        usage: meter.usage,
        included: quota,
        remaining: meter.balance,
        overage: meter.overage,
        rateLabel,
      };
    }
    // Track-only entitlement (no quota issued) on a price with a free range.
    return {
      kind: "meteredGeneric",
      usage: meter.usage,
      caption: `The first ${freeUnits.toLocaleString()} ${pluralizeUnit(unitName)} are included; additional usage is billed. ${NO_CAP}`,
      rateLabel,
    };
  }

  // Volume tiers, package and dynamic prices: we can't honestly say
  // "included" or "every call is billed", so make no such claims.
  return {
    kind: "meteredGeneric",
    usage: meter.usage,
    quota: quota > 0 ? quota : undefined,
    caption: `Usage is billed per your plan's pricing. ${NO_CAP}`,
    rateLabel,
  };
};
