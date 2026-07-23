import type { TieredPrice } from "../types/PlanType.js";
import { formatPrice } from "./formatPrice.js";
import { pluralizeUnit } from "./pluralizeUnit.js";

export type TieredPriceBreakdownTier = {
  upToAmount?: string;
  unitPriceAmount?: string;
  flatPriceAmount?: string;
};

const parseAmount = (value: string | undefined) => {
  if (!value) return;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatBound = (value: number) => value.toLocaleString("en-US");

/**
 * Render a multi-tier tiered price as one line per tier. The wording depends
 * on the price's `mode`, because the same tiers bill very differently:
 *
 * - `graduated` (the default when omitted, matching the rest of the plugin):
 *   each unit is priced by the tier it falls into, so lines read as
 *   consecutive unit ranges — "First 100: …", "Next 400: …", "Over 500: …".
 * - `volume`: the highest tier reached prices ALL units, so lines read as
 *   total-usage brackets — "Up to 100: …", "Over 100: …" — and rows past the
 *   first spell out that their per-unit rate applies to every unit, not just
 *   the units beyond the previous bound ("(all requests)", using the
 *   configured unit label).
 */
export const formatTieredPriceBreakdown = (opts: {
  tiers: TieredPriceBreakdownTier[];
  mode?: TieredPrice["mode"];
  currency?: string;
  unitLabel: string;
  includedLabel: string;
}): string[] | undefined => {
  const { tiers, currency, unitLabel, includedLabel } = opts;
  const mode = opts.mode ?? "graduated";
  if (!tiers || tiers.length <= 1) return;

  const lines: string[] = [];
  let lastUpTo: number | undefined;

  for (const [index, tier] of tiers.entries()) {
    const upTo = parseAmount(tier.upToAmount);
    const unit = parseAmount(tier.unitPriceAmount) ?? 0;
    const flat = parseAmount(tier.flatPriceAmount) ?? 0;

    const prefix = (() => {
      if (upTo == null) {
        // Open-ended tier: everything beyond the previous bound (both modes).
        return lastUpTo != null
          ? `Over ${formatBound(lastUpTo)}`
          : `Per ${unitLabel}`;
      }
      if (mode === "volume") return `Up to ${formatBound(upTo)}`;
      if (lastUpTo == null) {
        // Graduated without a previous bound: only the first tier can honestly
        // say "First X"; otherwise (malformed bounds) fall back to the bound.
        return index === 0
          ? `First ${formatBound(upTo)}`
          : `Up to ${formatBound(upTo)}`;
      }
      const span = upTo - lastUpTo;
      return span > 0
        ? `Next ${formatBound(span)}`
        : `Up to ${formatBound(upTo)}`;
    })();

    const flatPart = flat > 0 ? formatPrice(flat, currency) : "";
    const unitPart =
      unit > 0 ? `${formatPrice(unit, currency)}/${unitLabel}` : "";
    const pricePart =
      flatPart && unitPart
        ? `${flatPart} + ${unitPart}`
        : flatPart || unitPart || includedLabel;
    // In volume mode a later row's rate is not marginal — it re-prices every
    // unit once the total lands in that bracket. Spell that out exactly where
    // the graduated misreading would be most costly: rows past the first that
    // carry a per-unit rate.
    const suffix =
      mode === "volume" && index > 0 && unitPart
        ? ` (all ${pluralizeUnit(unitLabel)})`
        : "";
    lines.push(`${prefix}: ${pricePart}${suffix}`);

    if (upTo != null) lastUpTo = upTo;
  }

  return lines.length > 0 ? lines : undefined;
};
