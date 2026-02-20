if (typeof Object.groupBy === "undefined") {
  Object.groupBy = <K extends PropertyKey, T>(
    items: Iterable<T>,
    keySelector: (item: T, index: number) => K,
  ): Partial<Record<K, T[]>> => {
    const result = {} as Record<K, T[]>;
    let index = 0;

    for (const item of items) {
      const key = keySelector(item, index++);

      result[key] ??= [];
      result[key].push(item);
    }
    return result;
  };
}
