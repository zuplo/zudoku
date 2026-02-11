// biome-ignore lint/suspicious/noExplicitAny: Generic type
export type RecordAny = Record<string, any>;

export const traverse = <T extends RecordAny>(
  obj: T,
  fn: (obj: RecordAny) => RecordAny,
): T => {
  const processValue = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map(processValue);
    }
    if (value !== null && typeof value === "object") {
      return traverse(value as RecordAny, fn);
    }
    return value;
  };

  const processed = fn(obj);
  const result: RecordAny = {};

  for (const [key, value] of Object.entries(processed)) {
    result[key] = processValue(value);
  }

  return result as T;
};
