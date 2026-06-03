import type { Feature, Quota } from "../types/PlanType.js";

export type EntitlementSet = { quotas: Quota[]; features: Feature[] };

export type EntitlementChange = {
  key: string;
  /** Display label, disambiguated when two different keys share a name. */
  label: string;
  kind: "quota" | "feature";
  /**
   * `increase`/`decrease` are only used for like-for-like numeric quotas on the
   * SAME period. Cross-cadence or pricing-model differences are `changed`
   * (neutral) so we never draw a misleading up/down arrow.
   */
  change: "added" | "removed" | "increase" | "decrease" | "changed" | "same";
  currentValue?: string;
  targetValue?: string;
};

/** Compact, human-readable value for a quota row. */
export const quotaValueLabel = (q: Quota): string => {
  if (q.unitPrice) return q.unitPrice;
  if (q.tierPrices && q.tierPrices.length > 0) return "Tiered pricing";
  if (q.isPayg) return "Usage-based";
  return `${q.limit.toLocaleString("en-US")} / ${q.period}`;
};

const featureValueLabel = (f: Feature): string => f.value ?? "Included";

const isPlainNumericQuota = (q: Quota): boolean =>
  !q.isPayg && !q.unitPrice && (!q.tierPrices || q.tierPrices.length === 0);

/**
 * Compare two plans' entitlements, matching strictly by feature key (never by
 * display name). Each key yields exactly one change row, so a key that exists
 * on one side and a differently-keyed feature that merely shares a display
 * name can never read as a contradictory "added" + "removed" of the same
 * thing. Labels are disambiguated afterwards when they would collide.
 */
export const comparePlanEntitlements = (
  current: EntitlementSet,
  target: EntitlementSet,
): EntitlementChange[] => {
  const changes: Array<EntitlementChange & { period?: string }> = [];

  const curQuota = new Map(current.quotas.map((q) => [q.key, q]));
  const tgtQuota = new Map(target.quotas.map((q) => [q.key, q]));
  const curFeat = new Map(current.features.map((f) => [f.key, f]));
  const tgtFeat = new Map(target.features.map((f) => [f.key, f]));

  for (const key of new Set([...curQuota.keys(), ...tgtQuota.keys()])) {
    const c = curQuota.get(key);
    const t = tgtQuota.get(key);
    if (c && t) {
      const currentValue = quotaValueLabel(c);
      const targetValue = quotaValueLabel(t);
      let change: EntitlementChange["change"] = "same";
      if (
        isPlainNumericQuota(c) &&
        isPlainNumericQuota(t) &&
        c.period === t.period
      ) {
        if (t.limit > c.limit) change = "increase";
        else if (t.limit < c.limit) change = "decrease";
      } else if (currentValue !== targetValue) {
        // Cross-cadence or pricing-model change — neutral, no arrow direction.
        change = "changed";
      }
      changes.push({
        key,
        label: t.name,
        kind: "quota",
        change,
        currentValue,
        targetValue,
        period: t.period,
      });
    } else if (t) {
      changes.push({
        key,
        label: t.name,
        kind: "quota",
        change: "added",
        targetValue: quotaValueLabel(t),
        period: t.period,
      });
    } else if (c) {
      changes.push({
        key,
        label: c.name,
        kind: "quota",
        change: "removed",
        currentValue: quotaValueLabel(c),
        period: c.period,
      });
    }
  }

  for (const key of new Set([...curFeat.keys(), ...tgtFeat.keys()])) {
    const c = curFeat.get(key);
    const t = tgtFeat.get(key);
    if (c && t) {
      const currentValue = featureValueLabel(c);
      const targetValue = featureValueLabel(t);
      changes.push({
        key,
        label: t.name,
        kind: "feature",
        change: currentValue === targetValue ? "same" : "changed",
        currentValue,
        targetValue,
      });
    } else if (t) {
      changes.push({
        key,
        label: t.name,
        kind: "feature",
        change: "added",
        targetValue: featureValueLabel(t),
      });
    } else if (c) {
      changes.push({
        key,
        label: c.name,
        kind: "feature",
        change: "removed",
        currentValue: featureValueLabel(c),
      });
    }
  }

  // Disambiguate colliding labels (e.g. two distinct keys both named "API
  // Requests") by appending the quota period, so an added row and a removed
  // row never read as a literal contradiction on the identical string.
  const labelCounts = new Map<string, number>();
  for (const ch of changes) {
    labelCounts.set(ch.label, (labelCounts.get(ch.label) ?? 0) + 1);
  }
  return changes.map(({ period, ...ch }) => {
    if ((labelCounts.get(ch.label) ?? 0) > 1 && ch.kind === "quota" && period) {
      return { ...ch, label: `${ch.label} (${period})` };
    }
    return ch;
  });
};
