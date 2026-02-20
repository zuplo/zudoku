import type { SchemaObject } from "../../../oas/graphql/index.js";
import { isCircularRef } from "../schema/utils.js";

const getNumberExample = (schema: SchemaObject): number => {
  const min =
    typeof schema.exclusiveMinimum === "number"
      ? schema.exclusiveMinimum
      : typeof schema.minimum === "number"
        ? schema.minimum
        : undefined;
  const max =
    typeof schema.exclusiveMaximum === "number"
      ? schema.exclusiveMaximum
      : typeof schema.maximum === "number"
        ? schema.maximum
        : undefined;

  const minOffset = typeof schema.exclusiveMinimum === "number" ? 1 : 0;
  const maxOffset = typeof schema.exclusiveMaximum === "number" ? 1 : 0;

  if (min !== undefined && min >= 0) return min + minOffset;
  if (max !== undefined && max <= 0) return max - maxOffset;
  return 0;
};

const getStringExample = (schema: SchemaObject, name?: string): string => {
  const base = name || "string";
  const minLength = schema.minLength ?? 0;
  if (base.length >= minLength) return base;
  return base.padEnd(minLength, "a");
};

export const generateSchemaExample = (
  schema?: SchemaObject,
  name?: string,
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
): any => {
  if (!schema || isCircularRef(schema)) {
    return null;
  }

  if (schema.example !== undefined) {
    return schema.example;
  }

  if (
    schema.examples &&
    typeof schema.examples === "object" &&
    "default" in schema.examples
  ) {
    const defaultExample = schema.examples.default;
    if (defaultExample !== null) {
      return typeof defaultExample === "object" && "value" in defaultExample
        ? defaultExample.value
        : defaultExample;
    }
  }

  if (schema.const !== undefined) {
    return schema.const;
  }

  if (schema.default !== undefined) {
    return schema.default;
  }

  // Resolve nullable array types (e.g. ["null", "string"]) to the non-null type
  const schemaType = Array.isArray(schema.type)
    ? (schema.type.find((t) => t !== "null") ?? schema.type[0])
    : schema.type;

  if (
    schema.examples &&
    Array.isArray(schema.examples) &&
    schema.examples.length > 0
  ) {
    return schema.examples[0];
  }

  if (schemaType === "object" && schema.properties) {
    // biome-ignore lint/suspicious/noExplicitAny: Allow any type
    const example: Record<string, any> = {};

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (typeof propSchema === "object") {
        example[key] = generateSchemaExample(propSchema, key);
      }
    }

    return example;
  }

  if (
    schemaType === "object" &&
    !schema.properties &&
    schema.additionalProperties &&
    typeof schema.additionalProperties === "object"
  ) {
    return { key: generateSchemaExample(schema.additionalProperties) };
  }

  if (schemaType === "array" && "items" in schema) {
    if (Array.isArray(schema.items)) {
      return schema.items.map((itemSchema) =>
        generateSchemaExample(itemSchema),
      );
    }
    if (schema.items) {
      return [generateSchemaExample(schema.items)];
    }
    return [];
  }

  if (schemaType === "array") {
    return [];
  }

  if (schema.format !== undefined) {
    switch (schema.format) {
      case "date-time":
        return "2024-08-25T15:00:00Z";
      case "date":
        return "2024-08-25";
      case "time":
        return "15:00:00";
      case "email":
        return "test@example.com";
      case "uri":
        return "https://www.example.com/path/to/resource";
      case "uri-reference":
        return "/path/to/resource";
      case "uuid":
        return "00000000-0000-0000-0000-000000000000";
      case "ipv4":
        return "192.168.1.1";
      case "ipv6":
        return "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
      case "hostname":
        return "example.com";
      case "password":
        return "********";
      case "byte":
        return "U3dhZ2dlcg==";
      case "binary":
        return "<binary>";
      case "duration":
        return "P3D";
      case "int32":
      case "int64":
      case "float":
      case "double":
        return getNumberExample(schema);
    }
  }

  if (schema.enum) {
    return schema.enum[0];
  }

  if (schema.oneOf && schema.oneOf.length > 0) {
    const nonNull = schema.oneOf.find((s) => s.type !== "null");
    return generateSchemaExample(nonNull ?? schema.oneOf[0]);
  }

  if (schema.anyOf && schema.anyOf.length > 0) {
    const nonNull = schema.anyOf.find((s) => s.type !== "null");
    return generateSchemaExample(nonNull ?? schema.anyOf[0]);
  }

  switch (schemaType) {
    case "string":
      return getStringExample(schema, name);
    case "number":
    case "integer":
      return getNumberExample(schema);
    case "boolean":
      return true;
    case "null":
      return null;
    case "object":
      return {};
    default:
      return {};
  }
};
