/**
 * The number of leading usage units that don't increase the bill — the truly
 * "included" units, derived from the price alone (never from the entitlement
 * quota, which is informational for soft limits).
 *
 * Graduated tiers with a $0 unit price count as free: a flat price on the
 * first tier is a fixed charge (its units are still marginally free), while a
 * flat on a later tier makes crossing into that tier paid. Volume-mode tiers,
 * package and dynamic prices are conservatively treated as billing from the
 * first unit, and flat prices have no usage units at all (0). Infinity is
 * returned only for usage prices whose free range is open-ended: a $0 unit
 * price or graduated tiers that stay free through the last tier.
 */

type PricePartLike = { amount?: string } | null | undefined;

export type UsagePriceLike = {
  type?: string;
  mode?: string;
  amount?: string;
  tiers?: Array<{
    upToAmount?: string;
    unitPrice?: PricePartLike;
    flatPrice?: PricePartLike;
  }>;
};

const partAmount = (part: PricePartLike): number => {
  if (!part || part.amount === undefined) return 0;
  const amount = parseFloat(part.amount);
  // A malformed amount is conservatively treated as paid, not free.
  return Number.isFinite(amount) ? amount : Number.POSITIVE_INFINITY;
};

export const priceIncludedUnits = (
  price: UsagePriceLike | null | undefined,
): number => {
  if (!price) return 0;
  if (
    price.type === "flat" ||
    price.type === "package" ||
    price.type === "dynamic"
  ) {
    return 0;
  }

  if (price.tiers?.length) {
    if ((price.mode ?? "graduated") !== "graduated") return 0;

    const sorted = [...price.tiers].sort((a, b) => {
      if (a.upToAmount === undefined) return 1;
      if (b.upToAmount === undefined) return -1;
      return Number(a.upToAmount) - Number(b.upToAmount);
    });

    let free = 0;
    for (const [index, tier] of sorted.entries()) {
      if (partAmount(tier.unitPrice) > 0) break;
      if (index > 0 && partAmount(tier.flatPrice) > 0) break;
      if (tier.upToAmount === undefined) return Number.POSITIVE_INFINITY;
      // A malformed or non-increasing bound ends the free range rather than
      // silently carrying the previous one forward.
      const bound = Number(tier.upToAmount);
      if (!Number.isFinite(bound) || bound <= free) break;
      free = bound;
    }
    return free;
  }

  if (price.type === "unit") {
    const amount = parseFloat(price.amount ?? "");
    return Number.isFinite(amount) && amount === 0
      ? Number.POSITIVE_INFINITY
      : 0;
  }

  return 0;
};
