import { GraphQLError } from "graphql/error/index.js";
import { OpenAPIV3, type OpenAPIV3_1 } from "openapi-types";
import { dereference, type JSONSchema } from "./dereference/index.js";
import { upgradeSchema } from "./upgrade/index.js";

// Must be an interface (not a type) to allow merging with OpenAPI types with index signatures
interface WithRef {
  __$ref?: string;
}

type DeepOmitReference<T> = T extends OpenAPIV3_1.ReferenceObject
  ? never
  : T extends object
    ? { [K in keyof T]: DeepOmitReference<T[K]> } & WithRef
    : T;

export type OpenAPIDocument = DeepOmitReference<OpenAPIV3_1.Document>;
export type ResponseObject = DeepOmitReference<OpenAPIV3_1.ResponseObject>;
export type OperationObject = DeepOmitReference<OpenAPIV3_1.OperationObject>;
export type PathsObject = DeepOmitReference<OpenAPIV3_1.PathsObject>;
export type PathItemObject = DeepOmitReference<OpenAPIV3_1.PathItemObject>;
export type ParameterObject = DeepOmitReference<OpenAPIV3_1.ParameterObject>;
export type TagObject = DeepOmitReference<OpenAPIV3_1.TagObject>;
export type ExampleObject = DeepOmitReference<OpenAPIV3_1.ExampleObject>;
export type EncodingObject = DeepOmitReference<OpenAPIV3_1.EncodingObject>;
export type SchemaObject = DeepOmitReference<OpenAPIV3_1.SchemaObject>;
export type ServerObject = DeepOmitReference<OpenAPIV3_1.ServerObject>;

export const HttpMethods = Object.values(OpenAPIV3.HttpMethods);

const parseSchemaInput = async (
  schemaInput: unknown,
): Promise<JSONSchema & { openapi?: string }> => {
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
      let response;
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

  throw new GraphQLError("Unsupported schema input: " + schemaInput);
};

/**
 * Validates, dereferences and upgrades the OpenAPI schema (to v3.1) if necessary.
 */
export const validate = async (schemaInput: unknown) => {
  const schema = await parseSchemaInput(schemaInput);

  if (!schema.openapi) {
    throw new GraphQLError("OpenAPI version is not defined");
  }

  const dereferenced = await dereference(schema);
  const upgraded = upgradeSchema(dereferenced);

  return upgraded;
};
