/* eslint-disable @typescript-eslint/no-explicit-any */
import { type SchemaObject } from "../../../oas/graphql/index.js";

export const isObject = (value: unknown): boolean =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const generateSchemaExample = (
  schema: SchemaObject,
  name?: string,
): any => {
  // Directly return the example or default if they exist
  if (schema.example !== undefined) {
    return schema.example;
  } else if (schema.default !== undefined) {
    return schema.default;
  }

  // Process examples object
  if (schema.examples && isObject(schema.examples)) {
    return Object.values(schema.examples)[0];
  }

  // Recursively process objects and arrays
  return processComplexTypes(schema, name);
};

function processComplexTypes(schema: SchemaObject, name?: string): any {
  const properties = Object.entries(schema.properties ?? {}).concat(
    Object.entries(schema.additionalProperties ?? {}),
  );
  if (schema.type === "object" && properties.length > 0) {
    const obj: { [key: string]: any } = {};
    properties.forEach(([key, propSchema]) => {
      const value = generateSchemaExample(propSchema, key);
      if (value !== undefined) {
        obj[key] = value;
      }
    });
    return obj;
  } else if (schema.type === "array" && schema.items) {
    const value = generateSchemaExample(schema.items, name);
    if (value !== undefined) {
      return [value];
    }
    return [];
  }
  // Fallback for missing or undefined types
  return undefined; //getDefaultForType(schema.type);
}

function getDefaultForType(type?: string | string[]): any {
  if (Array.isArray(type)) {
    return getDefaultForSingleType(type[0]);
  }
  return getDefaultForSingleType(type);
}

function getDefaultForSingleType(type?: string): any {
  switch (type) {
    case "string":
      return "";
    case "number":
    case "integer":
      return 0;
    case "boolean":
      return false;
    case "null":
      return null;
    default:
      return "undefined";
  }
}
