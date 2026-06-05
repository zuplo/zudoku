/** Plan-metadata key holding the per-phase rate-card display order. */
export const RATE_CARD_ORDER_METADATA_KEY = "zuplo_rate_card_order";

/**
 * Parse the per-phase rate-card display order persisted in a plan's metadata.
 *
 * The order is authored in the portal and stored as a JSON-encoded string under
 * `metadata["zuplo_rate_card_order"]` — a map of phase key → ordered rate-card
 * keys. OpenMeter does not preserve rate-card array order on read, so this
 * metadata is the authoritative source for display order. Returns `undefined`
 * when the key is absent or malformed, in which case callers should leave the
 * incidental array order untouched.
 */
export const parseRateCardOrder = (plan: {
  metadata?: Record<string, unknown> | null;
}): Record<string, string[]> | undefined => {
  const raw = plan.metadata?.[RATE_CARD_ORDER_METADATA_KEY];
  if (typeof raw !== "string" || raw === "") return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return undefined;
  }

  const order: Record<string, string[]> = {};
  for (const [phaseKey, value] of Object.entries(parsed)) {
    if (Array.isArray(value)) {
      order[phaseKey] = value.filter((k): k is string => typeof k === "string");
    }
  }
  return Object.keys(order).length > 0 ? order : undefined;
};

/**
 * Stable-sort rate cards by their key's position in `order`. Keys absent from
 * `order` (or when `order` is undefined/empty) keep their incidental relative
 * position at the end — mirroring the plan-ordering behaviour in the portal
 * (`sortPlansByOrder`). Returns a new array; never mutates the input.
 */
export const sortRateCardsByOrder = <T extends { key: string }>(
  rateCards: T[],
  order: string[] | undefined,
): T[] => {
  if (!order || order.length === 0) return rateCards;
  const index = new Map(order.map((key, i) => [key, i]));
  // Unknown keys rank after every known key (order.length); equal ranks keep
  // input order under the stable sort, so incidental order is preserved.
  const rank = (key: string) => index.get(key) ?? order.length;
  return [...rateCards].sort((a, b) => rank(a.key) - rank(b.key));
};
