import { type SchemaObject } from "../../../oas/graphql/index.js";

export const generateSchemaExample = (
  schema: SchemaObject,
  name?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  // Directly return the example or default if they exist
  if (schema.example !== undefined) {
    return schema.example;
  } else if (schema.examples) {
    return Object.values(schema.examples)[0];
  } else if (schema.default !== undefined) {
    return schema.default;
  }

  if (schema.properties || schema.type === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const example: any = {};

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
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
    } else if (schema.items) {
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
    case undefined:
    default:
      return {};
  }
};
