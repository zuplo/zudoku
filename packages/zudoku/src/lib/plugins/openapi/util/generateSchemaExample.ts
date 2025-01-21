import { type SchemaObject } from "../../../oas/graphql/index.js";

export const generateSchemaExample = (
  schema: SchemaObject,
  name?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
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

  if (schema.enum) {
    return schema.enum[0];
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
