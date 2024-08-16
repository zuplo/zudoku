export const groupBy = <
  T extends Record<PropertyKey, any>,
  KeySelector extends (item: T) => PropertyKey,
>(
  arr: T[],
  keySelector: KeySelector,
): Partial<Record<ReturnType<KeySelector>, T[]>> => {
  return arr.reduce(
    (accumulator, val) => {
      const groupedKey = keySelector(val) as ReturnType<KeySelector>;
      if (!accumulator[groupedKey]) {
        accumulator[groupedKey] = [];
      }
      accumulator[groupedKey].push(val);
      return accumulator;
    },
    {} as Record<ReturnType<KeySelector>, T[]>,
  );
};
