import { type RecordAny, traverse } from "../../../util/traverse.js";
import type { OpenAPIDocument } from "../index.js";
/**
 * Upgrade from OpenAPI 3.0.x to 3.1.0
 *
 * Taken from https://github.com/scalar/openapi-parser/blob/main/packages/openapi-parser/src/utils/upgradeFromThreeToThreeOne.ts
 * https://www.openapis.org/blog/2021/02/16/migrating-from-openapi-3-0-to-3-1-0
 */

export const upgradeSchema = (schema: RecordAny): OpenAPIDocument => {
  if (schema.openapi?.startsWith("3.0")) {
    schema.openapi = "3.1.1";
  }

  schema = traverse(schema, (sub) => {
    if (typeof sub.type !== "undefined" && sub.nullable === true) {
      sub.type = ["null", sub.type];
      delete sub.nullable;
    }

    return sub;
  });

  schema = traverse(schema, (sub) => {
    if (sub.exclusiveMinimum === true) {
      sub.exclusiveMinimum = sub.minimum;
      delete sub.minimum;
    } else if (sub.exclusiveMinimum === false) {
      delete sub.exclusiveMinimum;
    }

    if (sub.exclusiveMaximum === true) {
      sub.exclusiveMaximum = sub.maximum;
      delete sub.maximum;
    } else if (sub.exclusiveMaximum === false) {
      delete sub.exclusiveMaximum;
    }

    return sub;
  });

  schema = traverse(schema, (sub, path) => {
    if (sub.example !== undefined) {
      // Arrays in schemas
      if (isSchemaPath(path ?? [])) {
        sub.examples = [sub.example];
      } else {
        // Objects everywhere else
        sub.examples = {
          default: {
            value: sub.example,
          },
        };
      }
      delete sub.example;
    }
    return sub;
  });

  // Multipart file uploads with a binary file
  schema = traverse(schema, (schema, path) => {
    if (schema.type === "object" && schema.properties !== undefined) {
      // Check if this is a multipart request body schema
      const parentPath = path?.slice(0, -1);
      const isMultipart = parentPath?.some((segment, index) => {
        return (
          segment === "content" && path?.[index + 1] === "multipart/form-data"
        );
      });

      if (isMultipart) {
        // Types
        // biome-ignore lint/suspicious/noExplicitAny: Allow any type
        const entries: [string, any][] = Object.entries(schema.properties);

        for (const [, value] of entries) {
          if (
            typeof value === "object" &&
            value.type === "string" &&
            value.format === "binary"
          ) {
            value.contentMediaType = "application/octet-stream";
            delete value.format;
          }
        }
      }
    }

    return schema;
  });

  // Uploading a binary file in a POST request
  schema = traverse(schema, (schema, path) => {
    if (
      path?.includes("content") &&
      path.includes("application/octet-stream")
    ) {
      return {};
    }

    if (schema.type === "string" && schema.format === "binary") {
      return {
        type: "string",
        contentMediaType: "application/octet-stream",
      };
    }

    return schema;
  });

  schema = traverse(schema, (sub) => {
    if (sub.type === "string" && sub.format === "binary") {
      // biome-ignore lint/suspicious/noExplicitAny: Allow any type
      return undefined as any;
    }

    return sub;
  });

  // Uploading an image with base64 encoding
  schema = traverse(schema, (sub) => {
    if (sub.type === "string" && sub.format === "base64") {
      return {
        type: "string",
        contentEncoding: "base64",
      };
    }

    return sub;
  });

  schema = traverse(schema, (schema, path) => {
    if (schema.type === "string" && schema.format === "byte") {
      const parentPath = path?.slice(0, -1);
      const contentMediaType = parentPath?.find(
        (_, index) => path?.[index - 1] === "content",
      );

      return {
        type: "string",
        contentEncoding: "base64",
        contentMediaType,
      };
    }

    return schema;
  });

  return schema as OpenAPIDocument;
};

export function isSchemaPath(path: string[]): boolean {
  const schemaLocations = [
    ["components", "schemas"],
    "properties",
    "items",
    "allOf",
    "anyOf",
    "oneOf",
    "not",
    "additionalProperties",
  ];

  return (
    schemaLocations.some((location) => {
      if (Array.isArray(location)) {
        return location.every((segment, index) => path[index] === segment);
      }
      return path.includes(location);
    }) ||
    path.includes("schema") ||
    path.some((segment) => segment.endsWith("Schema"))
  );
}
