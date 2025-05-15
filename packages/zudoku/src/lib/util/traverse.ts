import type { JsonValue, RecordAny } from "./types.js";

export type { RecordAny };

export const traverse = <T extends JsonValue = RecordAny>(
  specification: RecordAny,
  transform: (specification: RecordAny, path?: string[]) => T,
  path: string[] = [],
) => {
  const transformed = transform(specification, path);
  if (typeof transformed !== "object" || transformed === null) {
    return transformed;
  }

  const result: RecordAny = Array.isArray(transformed) ? [] : {};

  for (const [key, value] of Object.entries(transformed)) {
    const currentPath = [...path, key];

    if (Array.isArray(value)) {
      result[key] = value.map((item, index) =>
        typeof item === "object" && item != null
          ? traverse(item, transform, [...currentPath, index.toString()])
          : item,
      );
    } else if (typeof value === "object" && value != null) {
      result[key] = traverse(value, transform, currentPath);
    } else {
      result[key] = value;
    }
  }

  return result;
};
