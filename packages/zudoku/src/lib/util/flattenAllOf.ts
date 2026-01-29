import {
  createComparator,
  createMerger,
  createShallowAllOfMerge,
} from "@x0k/json-schema-merge";
import {
  createDeduplicator,
  createIntersector,
} from "@x0k/json-schema-merge/lib/array";
import type { JSONSchema7Definition } from "json-schema";

const { compareSchemaDefinitions, compareSchemaValues } = createComparator();
const { mergeArrayOfSchemaDefinitions } = createMerger({
  intersectJson: createIntersector(compareSchemaValues),
  deduplicateJsonSchemaDef: createDeduplicator(compareSchemaDefinitions),
});

const shallowAllOfMerge = createShallowAllOfMerge(
  mergeArrayOfSchemaDefinitions,
);

// Recursively flattens all `allOf` keywords in a JSON Schema object.
export const flattenAllOf = (
  schema: JSONSchema7Definition,
): JSONSchema7Definition => {
  const merged = shallowAllOfMerge(schema);

  // Convert boolean schemas to object form for OpenAPI compatibility
  // true (accepts anything) → {} (empty schema)
  // false (rejects everything) → { not: {} } (schema that never validates)
  if (typeof merged === "boolean") {
    return merged ? {} : { not: {} };
  }

  if (merged == null || typeof merged !== "object") {
    return merged;
  }

  const { properties, items, additionalProperties } = merged;

  if (properties != null && typeof properties === "object") {
    for (const [name, sub] of Object.entries(properties)) {
      if (sub && typeof sub === "object") {
        properties[name] = flattenAllOf(sub);
      }
    }
  }

  if (items != null && typeof items === "object") {
    if (Array.isArray(items)) {
      merged.items = items.map((it: JSONSchema7Definition) =>
        it && typeof it === "object" ? flattenAllOf(it) : it,
      );
    } else {
      merged.items = flattenAllOf(items);
    }
  }

  if (additionalProperties && typeof additionalProperties === "object") {
    merged.additionalProperties = flattenAllOf(additionalProperties);
  }

  for (const key of ["anyOf", "oneOf"] as const) {
    const arr = merged[key];
    if (!Array.isArray(arr)) continue;
    merged[key] = arr.map((v) =>
      typeof v === "object" && v != null ? flattenAllOf(v) : v,
    );
  }

  return merged;
};
