import { type SchemaObject } from "../../lib/oas/graphql/index.js";
import { isCircularRef } from "../../lib/plugins/openapi/schema/utils.js";

export const generateSchemaExample = (
  schema?: SchemaObject,
  name?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  if (!schema || isCircularRef(schema)) {
    return null;
  }

  // Check for schema-level example first
  if (schema.example !== undefined) {
    return schema.example;
  }

  // Then check for schema-level examples
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

  // No example needed for const values
  if (schema.const !== undefined) {
    return schema.const;
  }

  // For object schemas with properties
  if (schema.type === "object" && schema.properties) {
    const example: Record<string, any> = {};

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (typeof propSchema === "object") {
        example[key] = generateSchemaExample(propSchema as SchemaObject, key);
      }
    }

    return example;
  }

  if (schema.type === "array") {
    if (Array.isArray(schema.items)) {
      return schema.items.map((itemSchema) =>
        generateSchemaExample(itemSchema as SchemaObject),
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- OpenAPI schemas don't always adhere to spec
    if (schema.items) {
      return [generateSchemaExample(schema.items as SchemaObject)];
    }
    return [];
  }

  if (schema.format !== undefined) {
    // Partial implementation of JSON Schema format examples
    // https://json-schema.org/draft/2020-12/draft-bhutton-json-schema-validation-00#rfc.section.7.3
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
    }
  }

  if (schema.enum) {
    return schema.enum[0];
  }

  if (schema.oneOf) {
    const randomIndex = Math.floor(Math.random() * schema.oneOf.length);
    return generateSchemaExample(schema.oneOf[randomIndex] as SchemaObject);
  }

  if (schema.anyOf) {
    // Should likely be expanded to return a partial set of values, but it would require
    // detection if being used within an array or a string type.
    const randomIndex = Math.floor(Math.random() * schema.anyOf.length);
    return generateSchemaExample(schema.anyOf[randomIndex] as SchemaObject);
  }

  if (schema.allOf) {
    // https://swagger.io/docs/specification/v3_0/data-models/oneof-anyof-allof-not/#allof
    return schema.allOf.reduce((acc, allOfSchema) => {
      return { ...acc, ...generateSchemaExample(allOfSchema as SchemaObject) };
    }, {});
  }

  switch (schema.type) {
    case "string":
      return name || "string";
    case "number":
    case "integer":
      return 0;
    case "boolean":
      return true;
    case "null":
      return null;
    case "object":
      return {};
    case undefined:
    default:
      return {};
  }
};
