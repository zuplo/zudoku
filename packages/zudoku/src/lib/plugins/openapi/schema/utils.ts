import {
  CIRCULAR_REF,
  SCHEMA_REF_PREFIX,
} from "../../../oas/graphql/constants.js";
import type {
  ArraySchemaObject,
  SchemaObject,
} from "../../../oas/parser/index.js";

export const isBasicType = (
  type: unknown,
): type is "string" | "number" | "boolean" | "integer" | "null" =>
  (typeof type === "string" &&
    ["string", "number", "boolean", "integer", "null"].includes(type)) ||
  (Array.isArray(type) && type.every(isBasicType));

export const isArrayType = (value: SchemaObject): value is ArraySchemaObject =>
  value.type === "array" ||
  // schema.type might be an array of types, so we need to check if "array" is one of them
  (Array.isArray(value.type) && value.type.includes("array"));

export const isComplexType = (value?: SchemaObject) =>
  value &&
  ((value.type === "object" &&
    Object.keys(value.properties ?? {}).length > 0) ||
    (value.type === "array" &&
      typeof value.items === "object" &&
      (!value.items.type || value.items.type === "object")));

export const isCircularRef = (schema: unknown): schema is string =>
  typeof schema === "string" &&
  (schema.startsWith(CIRCULAR_REF) || schema.startsWith(SCHEMA_REF_PREFIX));

export const isArrayCircularRef = (
  schema: SchemaObject,
): schema is SchemaObject & { items: SchemaObject } =>
  isArrayType(schema) && "items" in schema && isCircularRef(schema.items);

export const extractCircularRefInfo = (
  ref?: string | SchemaObject,
): string | undefined => {
  if (typeof ref !== "string") return undefined;

  if (ref.startsWith(SCHEMA_REF_PREFIX)) {
    return ref.slice(SCHEMA_REF_PREFIX.length).split("/").pop();
  }

  return ref.split(":")[1];
};

/**
 * Filters out readOnly properties from a schema object.
 * According to OpenAPI spec, readOnly properties should not be sent in requests.
 *
 * @param schema - The schema object to filter
 * @returns A new schema object with readOnly properties removed
 */
export const filterReadOnlyProperties = (
  schema: SchemaObject,
): SchemaObject => {
  // If no properties, return as is
  if (!schema.properties || typeof schema.properties !== "object") {
    return schema;
  }

  // Filter out readOnly properties
  const filteredProperties = Object.fromEntries(
    Object.entries(schema.properties).filter(
      ([_key, value]) => !value?.readOnly,
    ),
  );

  // Update required array to exclude readOnly fields
  const filteredRequired = schema.required?.filter((fieldName) => {
    const property = schema.properties?.[fieldName];
    return !property?.readOnly;
  });

  // Build the result schema
  const result: SchemaObject = {
    ...schema,
    properties: filteredProperties,
  };

  // Only include required if it has items
  if (filteredRequired && filteredRequired.length > 0) {
    result.required = filteredRequired;
  } else {
    // Remove required field if it was empty
    delete result.required;
  }

  return result;
};
