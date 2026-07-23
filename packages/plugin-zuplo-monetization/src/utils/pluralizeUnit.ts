// Naive English pluralization for configured unit names ("request" →
// "requests"); names already ending in "s" pass through unchanged. The unit
// name comes from the pricing config (`pricing.units` keyed by rate card or
// feature key), with "unit" as the fallback everywhere in the plugin (see
// categorizeRateCards).
export const pluralizeUnit = (unitName: string) =>
  unitName.endsWith("s") ? unitName : `${unitName}s`;
