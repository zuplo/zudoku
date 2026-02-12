import { $RefParser } from "@apidevtools/json-schema-ref-parser";
import type { Processor } from "../../config/validators/BuildSchema.js";
import type { OpenAPIDocument } from "../oas/parser/index.js";
import { flattenAllOf } from "./flattenAllOf.js";
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
