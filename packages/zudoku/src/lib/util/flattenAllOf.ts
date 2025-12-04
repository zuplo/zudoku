import { $RefParser } from "@apidevtools/json-schema-ref-parser";
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

export const flattenAllOfProcessor: Processor = async ({ schema, file }) => {
  try {
    // Resolve refs once - creates a lookup table without modifying the schema
    const parser = new $RefParser();
    await parser.resolve(schema);
    const $refs = parser.$refs;

    const flattened = traverse(schema, (spec) => {
      if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
        return spec;
      }

      const isSchemaObject =
        "type" in spec ||
        "properties" in spec ||
        "allOf" in spec ||
        "anyOf" in spec ||
        "oneOf" in spec;

      if (!isSchemaObject) return spec;

      if ("allOf" in spec && Array.isArray(spec.allOf)) {
        const resolvedAllOf = spec.allOf.map((item) => {
          if (
            item &&
            typeof item === "object" &&
            "$ref" in item &&
            typeof item.$ref === "string"
          ) {
            try {
              return $refs.get(item.$ref) ?? item;
            } catch {
              return item;
            }
          }
          return item;
        });
        return flattenAllOf({ ...spec, allOf: resolvedAllOf }) as RecordAny;
      }

      return flattenAllOf(spec) as RecordAny;
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
    merged[key] = arr.map((v) =>
      typeof v === "object" && v != null ? flattenAllOf(v) : v,
    );
  }

  return merged;
};
