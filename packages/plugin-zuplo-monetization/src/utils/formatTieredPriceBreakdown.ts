import { formatPrice } from "./formatPrice.js";

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

export const formatTieredPriceBreakdown = (opts: {
  tiers: TieredPriceBreakdownTier[];
  currency?: string;
  unitLabel: string;
  includedLabel: string;
  omitIncludedUpToAmount?: number;
}): string[] | undefined => {
  const { tiers, currency, unitLabel, includedLabel, omitIncludedUpToAmount } =
    opts;
  if (!tiers || tiers.length <= 1) return;

  const lines: string[] = [];
  let lastUpTo: number | undefined;

  for (const tier of tiers) {
    const upTo = parseAmount(tier.upToAmount);
    const unit = parseAmount(tier.unitPriceAmount) ?? 0;
    const flat = parseAmount(tier.flatPriceAmount) ?? 0;

    const prefix =
      upTo != null
        ? `Up to ${upTo.toLocaleString("en-US")}`
        : lastUpTo != null
          ? `Over ${lastUpTo.toLocaleString("en-US")}`
          : `Per ${unitLabel}`;

    const unitPart =
      unit > 0 ? `${formatPrice(unit, currency)}/${unitLabel}` : includedLabel;
    const flatPart = flat > 0 ? ` + ${formatPrice(flat, currency)} base` : "";
    const line = `${prefix}: ${unitPart}${flatPart}`;

    // Avoid redundancy when the UI already shows the quota limit (e.g. "5,000 / month").
    if (
      omitIncludedUpToAmount != null &&
      upTo != null &&
      upTo === omitIncludedUpToAmount &&
      unitPart === includedLabel &&
      flatPart === ""
    ) {
      // skip
    } else {
      lines.push(line);
    }

    if (upTo != null) lastUpTo = upTo;
  }

  return lines.length > 0 ? lines : undefined;
};
