import type { JSONSchema } from "./index.js";

const cache = new Map<JSONSchema, Map<string, unknown>>();

/**
 * Resolves a $ref pointer in a schema and returns the referenced value.
 */
export const resolveLocalRef = (schema: JSONSchema, ref: string): unknown => {
  if (!cache.has(schema)) {
    cache.set(schema, new Map<string, unknown>());
  }
  const schemaCache = cache.get(schema);

  if (schemaCache!.has(ref)) {
    return schemaCache!.get(ref);
  }

  const path = ref.split("/").slice(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = schema;
  for (const segment of path) {
    if (!current || typeof current !== "object") {
      // we've reached a dead end
      current = null;
    }
    current = current[segment] ?? null;
  }

  schemaCache!.set(ref, current);
  return current;
};
