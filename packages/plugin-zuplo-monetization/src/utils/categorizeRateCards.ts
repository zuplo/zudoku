import type { Feature, Quota, RateCard } from "../types/PlanType.js";
import { formatDuration } from "./formatDuration.js";
import { formatPrice } from "./formatPrice.js";
import { formatStaticEntitlementConfig } from "./formatStaticEntitlementConfig.js";
import { formatTieredPriceBreakdown } from "./formatTieredPriceBreakdown.js";
import { tierHasPositivePrice } from "./tierHasPositivePrice.js";

// Inline "$flat + $unit/label" price string for a single price point (a unit
// price or a single-tier tiered price) — the same flat-then-unit format the
// multi-tier breakdown uses. Undefined when both parts are zero/absent.
const formatInlinePrice = (opts: {
  flatAmount?: string;
  unitAmount?: string;
  currency?: string;
  unitLabel: string;
}): string | undefined => {
  const unit = parseFloat(opts.unitAmount ?? "0");
  const flat = parseFloat(opts.flatAmount ?? "0");
  const flatPart = flat > 0 ? formatPrice(flat, opts.currency) : "";
  const unitPart =
    unit > 0 ? `${formatPrice(unit, opts.currency)}/${opts.unitLabel}` : "";
  const pricePart =
    flatPart && unitPart ? `${flatPart} + ${unitPart}` : flatPart || unitPart;
  return pricePart || undefined;
};

export const categorizeRateCards = (
  rateCards: RateCard[],
  options?: {
    currency?: string;
    units?: Record<string, string>;
    planBillingCadence?: string | null;
  },
) => {
  const { currency, units, planBillingCadence } = options ?? {};
  const quotas: Quota[] = [];
  const features: Feature[] = [];

  for (const rc of rateCards) {
    const et = rc.entitlementTemplate;
    if (!et) continue;

    const unitLabelFor = (rcArg: typeof rc) =>
      units?.[rcArg.key] ?? units?.[rcArg.featureKey ?? ""] ?? "unit";
    // The displayed "X / period" tracks when the quota refills, not when
    // billing happens. Prefer the entitlement's `usagePeriod` (the admin
    // UI's "Quota resets every" field) — it's explicitly independent of
    // billing cadence. Fall back to the rate card or plan billing cadence
    // when no usage period is set.
    const periodFor = (rcArg: typeof rc) => {
      if (et.type === "metered" && et.usagePeriod) {
        return formatDuration(et.usagePeriod);
      }
      if (rcArg.billingCadence) return formatDuration(rcArg.billingCadence);
      if (planBillingCadence) return formatDuration(planBillingCadence);
      return "month";
    };

    // A metered card with a positive `issueAfterReset` represents a "free
    // quota" only when the price doesn't already bill from the first unit.
    // A tiered price with a priced first tier, or a unit price with a
    // positive amount, bills every unit including the issued ones — the
    // quota is a metering/display allowance, not free included usage, so
    // the card must show the billing truth (the PAYG branch) instead of an
    // "N / period" line that reads as included. A quota of 0 is the same as
    // no quota (the plan editor always serializes a number, 0 meaning
    // pay-as-you-go) — never render it as "0 / period".
    const firstTier =
      rc.price?.type === "tiered" && rc.price.tiers.length > 0
        ? rc.price.tiers[0]
        : undefined;
    const billsFromFirstUnit =
      (!!firstTier && tierHasPositivePrice(firstTier)) ||
      (rc.price?.type === "unit" && parseFloat(rc.price.amount) > 0);
    const includedQuota = et.type === "metered" ? (et.issueAfterReset ?? 0) : 0;
    // A hard limit's quota is a real cap the buyer must see even when the
    // price bills from the first unit, so it keeps the quota line (with the
    // price alongside). Only an explicit `isSoftLimit: false` counts —
    // when the flag is absent we don't claim a cap we can't verify, the
    // same stance `deriveUsageView` takes.
    const isHardCap = et.type === "metered" && et.isSoftLimit === false;

    if (
      et.type === "metered" &&
      includedQuota > 0 &&
      (isHardCap || !billsFromFirstUnit)
    ) {
      let tierPrices: string[] | undefined;
      if (rc.price?.type === "tiered" && rc.price.tiers) {
        // Build a readable tier breakdown (useful for graduated/volume).
        // The breakdown's "Up to X: Included" line conveys the included
        // quota; the UI hides the separate "X / period" header when this
        // breakdown is present, so the two never duplicate each other.
        tierPrices = formatTieredPriceBreakdown({
          tiers: rc.price.tiers.map((t) => ({
            upToAmount: t.upToAmount,
            unitPriceAmount: t.unitPrice?.amount,
            flatPriceAmount: t.flatPrice?.amount,
          })),
          currency,
          unitLabel: unitLabelFor(rc),
          includedLabel: "Included",
        });
      }
      // A priced rate on a hard cap renders inline next to the cap
      // ("1,000 / month — $0.03/unit") so neither the price nor the limit
      // is hidden. Covers unit prices AND single-tier tiered prices, which
      // produce no tier breakdown (formatTieredPriceBreakdown needs ≥2
      // tiers) and would otherwise show a cap with no price at all.
      const inlinePrice =
        rc.price?.type === "unit"
          ? formatInlinePrice({
              unitAmount: rc.price.amount,
              currency,
              unitLabel: unitLabelFor(rc),
            })
          : rc.price?.type === "tiered" && rc.price.tiers.length === 1
            ? formatInlinePrice({
                flatAmount: rc.price.tiers[0].flatPrice?.amount,
                unitAmount: rc.price.tiers[0].unitPrice?.amount,
                currency,
                unitLabel: unitLabelFor(rc),
              })
            : undefined;
      quotas.push({
        key: rc.featureKey ?? rc.key,
        name: rc.name,
        limit: includedQuota,
        period: periodFor(rc),
        tierPrices,
        ...(inlinePrice ? { unitPrice: inlinePrice } : {}),
        ...(isHardCap && billsFromFirstUnit ? { isHardCap: true } : {}),
      });
    } else if (et.type === "metered" && rc.type === "usage_based" && rc.price) {
      // Pay-as-you-go: usage-based card without a free included quota.
      // Covers true PAYG (zero or absent `issueAfterReset`) and soft-limit
      // cards whose price bills from the first unit (priced first tier or
      // positive unit price) — there the issued amount is an allowance for
      // the usage meter, not free included usage, and never blocks, so the
      // card shows the billing truth only. Hard caps stay on the quota
      // branch above so the limit is never hidden.
      const unitLabel = unitLabelFor(rc);
      if (rc.price.type === "tiered" && rc.price.tiers.length > 0) {
        const tiers = rc.price.tiers;
        // If every tier is flat=0 AND unit=0, the schedule is effectively
        // free — render as a feature rather than a PAYG quota with only
        // "Included" lines.
        const hasPositivePrice = tiers.some(tierHasPositivePrice);
        if (!hasPositivePrice) {
          features.push({ key: rc.featureKey ?? rc.key, name: rc.name });
          continue;
        }
        // Single-tier "tiered" prices can't produce a breakdown
        // (`formatTieredPriceBreakdown` needs ≥2 tiers), so synthesize
        // a single inline price string instead. "unitPrice" is a mild
        // misnomer when the result is a bare flat charge, but it's
        // rendered as a free-form inline string after the name.
        if (tiers.length === 1) {
          const pricePart = formatInlinePrice({
            flatAmount: tiers[0].flatPrice?.amount,
            unitAmount: tiers[0].unitPrice?.amount,
            currency,
            unitLabel,
          });
          if (pricePart) {
            quotas.push({
              key: rc.featureKey ?? rc.key,
              name: rc.name,
              limit: 0,
              period: periodFor(rc),
              unitPrice: pricePart,
              isPayg: true,
            });
            continue;
          }
          // Unreachable — `hasPositivePrice` above guarantees at
          // least one of flat/unit is positive. Defensive fallback
          // so we never render an empty body if invariants change.
          features.push({ key: rc.featureKey ?? rc.key, name: rc.name });
          continue;
        }
        const tierPrices = formatTieredPriceBreakdown({
          tiers: tiers.map((t) => ({
            upToAmount: t.upToAmount,
            unitPriceAmount: t.unitPrice?.amount,
            flatPriceAmount: t.flatPrice?.amount,
          })),
          currency,
          unitLabel,
          includedLabel: "Included",
        });
        quotas.push({
          key: rc.featureKey ?? rc.key,
          name: rc.name,
          limit: 0,
          period: periodFor(rc),
          tierPrices,
          isPayg: true,
        });
      } else if (rc.price.type === "unit" && parseFloat(rc.price.amount) > 0) {
        const amount = parseFloat(rc.price.amount);
        quotas.push({
          key: rc.featureKey ?? rc.key,
          name: rc.name,
          limit: 0,
          period: periodFor(rc),
          unitPrice: `${formatPrice(amount, currency)}/${unitLabel}`,
          isPayg: true,
        });
      } else {
        features.push({ key: rc.featureKey ?? rc.key, name: rc.name });
      }
    } else if (et.type === "metered") {
      // Any remaining metered card: it neither qualifies as a free included
      // quota (first branch) nor carries a usage price the PAYG branch can
      // render — typically a zero/absent quota on a flat-fee, free, or
      // priceless card. The card still conveys feature access, so list it
      // as a plain feature rather than a bogus "0 / period" quota — or
      // worse, dropping it entirely.
      features.push({ key: rc.featureKey ?? rc.key, name: rc.name });
    } else if (et.type === "boolean") {
      features.push({ key: rc.featureKey ?? rc.key, name: rc.name });
    } else if (et.type === "static" && et.config) {
      features.push({
        key: rc.featureKey ?? rc.key,
        name: rc.name,
        value: formatStaticEntitlementConfig(et.config),
      });
    }
  }

  return { quotas, features };
};
