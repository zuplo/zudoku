// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RecordAny = Record<string, any>;

export const traverse = (
  specification: RecordAny,
  transform: (specification: RecordAny) => RecordAny,
) => {
  const result: RecordAny = {};

  for (const [key, value] of Object.entries(specification)) {
    if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "object" && item !== null
          ? traverse(item, transform)
          : item,
      );
    } else if (typeof value === "object" && value !== null) {
      result[key] = traverse(value, transform);
    } else {
      result[key] = value;
    }
  }

  return transform(result);
};
