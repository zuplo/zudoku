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
import type { Processor } from "../../config/validators/BuildSchema.js";
import type { OpenAPIDocument } from "../oas/parser/index.js";
import { type RecordAny, traverse } from "./traverse.js";

export const flattenAllOfProcessor: Processor = async ({
  schema,
  file,
  dereference,
}) => {
  try {
    const dereferenced = await dereference(schema);

    const flattened = traverse(dereferenced, (spec) => {
      if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
        return spec;
      }

      const isSchemaObject =
        "type" in spec ||
        "properties" in spec ||
        "allOf" in spec ||
        "anyOf" in spec ||
        "oneOf" in spec;

      return isSchemaObject ? (flattenAllOf(spec) as RecordAny) : spec;
    }) as OpenAPIDocument;

    return flattened;
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.warn(
      `Failed to flatten \`allOf\` in ${file}: ${error instanceof Error ? error.message : error}`,
    );
    return schema;
  }
};

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
    merged[key] = arr.map((v) => (typeof v === "object" ? flattenAllOf(v) : v));
  }

  return merged;
};
