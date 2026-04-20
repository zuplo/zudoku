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

const COMPONENTS_SCHEMAS_PREFIX = "#/components/schemas/";

// Unescape a JSON Pointer token per RFC 6901: ~1 → /, ~0 → ~, then URI decode.
const unescapeJsonPointer = (token: string) =>
  decodeURIComponent(token.replace(/~1/g, "/").replace(/~0/g, "~"));

export const getSchemaRefName = (
  schema?: SchemaObject | null,
): string | undefined => {
  // Defensive: circular refs can arrive as "$ref:#/..." strings from
  // handleCircularRefs despite the typed parameter, so the `in` check below
  // would throw. Bail early.
  if (!schema || typeof schema !== "object") return;

  const ref = "__$ref" in schema ? schema.__$ref : undefined;
  if (typeof ref !== "string") return;
  if (!ref.startsWith(COMPONENTS_SCHEMAS_PREFIX)) return;

  return unescapeJsonPointer(ref.slice(COMPONENTS_SCHEMAS_PREFIX.length));
};

export const extractCircularRefInfo = (
  ref?: string | SchemaObject,
): string | undefined => {
  if (typeof ref !== "string") return undefined;

  if (ref.startsWith(SCHEMA_REF_PREFIX)) {
    return ref.slice(SCHEMA_REF_PREFIX.length).split("/").pop();
  }

  return ref.split(":")[1];
};
