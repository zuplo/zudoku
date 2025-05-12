export const ensureArray = <T extends NonNullable<unknown>>(
  value: T | T[],
): T[] => (Array.isArray(value) ? value : [value]);
