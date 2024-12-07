/* eslint-disable @typescript-eslint/no-explicit-any */
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
    schema.openapi = "3.1.0";
  }

  schema = traverse(schema, (sub) => {
    if (sub.type !== "undefined" && sub.nullable === true) {
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

  schema = traverse(schema, (sub) => {
    if (sub.example !== undefined) {
      sub.examples = {
        default: sub.example,
      };
      delete sub.example;
    }

    return sub;
  });

  schema = traverse(schema, (sub) => {
    if (sub.type === "object" && sub.properties !== undefined) {
      for (const [, value] of Object.entries(sub.properties)) {
        const v = (value ?? {}) as RecordAny;
        if (v.type === "string" && v.format === "binary") {
          v.contentEncoding = "application/octet-stream";
          delete v.format;
        }
      }
    }
    return sub;
  });

  schema = traverse(schema, (sub) => {
    if (sub.type === "string" && sub.format === "binary") {
      return undefined as any;
    }

    return sub;
  });

  schema = traverse(schema, (sub) => {
    if (sub.type === "string" && sub.format === "base64") {
      return {
        type: "string",
        contentEncoding: "base64",
      };
    }

    return sub;
  });

  return schema as OpenAPIDocument;
};
