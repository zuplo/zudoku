import { GraphQLError } from "graphql/error/index.js";
import type { JSONSchema } from "../../oas/parser/dereference/index.js";
import { dereference } from "../../oas/parser/dereference/index.js";
import { traverse } from "../../util/traverse.js";
import type { AsyncAPIDocument } from "../types.js";

const parseSchemaInput = async (
  schemaInput: unknown,
): Promise<JSONSchema & { asyncapi?: string }> => {
  if (typeof schemaInput === "string") {
    if (schemaInput.trim().startsWith("{")) {
      try {
        return JSON.parse(schemaInput);
      } catch (err) {
        throw new GraphQLError("Invalid JSON schema", {
          originalError: err,
        });
      }
    }
    if (schemaInput.includes("://")) {
      let response: Response;
      try {
        response = await fetch(schemaInput, {
          cache: "force-cache",
        });
      } catch (err) {
        throw new GraphQLError("Failed to fetch schema", {
          originalError: err,
        });
      }

      if (!response.ok) {
        throw new GraphQLError(
          `Failed to fetch schema: ${response.statusText}`,
        );
      }

      const schemaText = await response.text();

      try {
        if (schemaText.trim().startsWith("{")) {
          return JSON.parse(schemaText) as JSONSchema;
        } else {
          const yaml = await import("yaml");
          return yaml.parse(schemaText) as JSONSchema;
        }
      } catch (err) {
        throw new GraphQLError("Fetched invalid schema", {
          originalError: err,
        });
      }
    }
    const yaml = await import("yaml");
    const parsed = yaml.parse(schemaInput);

    if (typeof parsed === "object") return parsed;
  }

  if (typeof schemaInput === "object") return schemaInput as JSONSchema;

  throw new GraphQLError(`Unsupported schema input: ${schemaInput}`);
};

/**
 * Validates and dereferences the AsyncAPI schema.
 *
 * This only happens for URL schemas (or in standalone mode).
 * File schemas are pre-processed by the SchemaManager
 */
export const validate = async (schemaInput: unknown) => {
  const schema = await parseSchemaInput(schemaInput);

  if (!schema.asyncapi) {
    throw new GraphQLError("AsyncAPI version is not defined");
  }

  const dereferenced = await dereference(schema);

  // Traverse to ensure all nested objects are properly processed
  const processed = traverse(dereferenced, (spec) => {
    if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
      return spec;
    }
    return spec;
  }) as AsyncAPIDocument;

  return processed;
};
