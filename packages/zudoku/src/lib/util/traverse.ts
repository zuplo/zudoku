import type { JsonValue, RecordAny } from "./types.js";

export type { RecordAny };

export const traverse = <T extends JsonValue = RecordAny>(
  specification: RecordAny,
  transform: (specification: RecordAny) => T,
) => {
  const transformed = transform(specification);
  if (typeof transformed !== "object" || transformed === null) {
    return transformed;
  }

  const result: RecordAny = Array.isArray(transformed) ? [] : {};

  for (const [key, value] of Object.entries(transformed)) {
    if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "object" && item != null
          ? traverse(item, transform)
          : item,
      );
    } else if (typeof value === "object" && value != null) {
      result[key] = traverse(value, transform);
    } else {
      result[key] = value;
    }
  }

  return result;
};
