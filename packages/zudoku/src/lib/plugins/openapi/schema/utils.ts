import {
  CIRCULAR_REF,
  SCHEMA_REF_PREFIX,
} from "../../../oas/graphql/constants.js";
import type {
  ArraySchemaObject,
  SchemaObject,
} from "../../../oas/parser/index.js";
import { isBinaryContentType } from "../playground/fileUtils.js";

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

// OpenAPI 3.1 describes raw binary data (file uploads and downloads) with a
// `contentMediaType` and no `type`, e.g. `{ contentMediaType: "image/png" }`.
export const isBinarySchema = (schema?: SchemaObject) =>
  typeof schema === "object" &&
  schema.type === undefined &&
  schema.contentMediaType !== undefined;

// A body schema that doesn't describe its data (e.g. `{}`) under a binary
// media type is raw binary of that media type.
export const withBinaryMediaType = (
  schema: SchemaObject | null | undefined,
  mediaType: string | undefined,
): SchemaObject | undefined => {
  if (!schema) return undefined;

  const isUndescribedBinary =
    mediaType !== undefined &&
    schema.type === undefined &&
    schema.contentMediaType === undefined &&
    !schema.properties &&
    !schema.anyOf &&
    !schema.oneOf &&
    !schema.allOf &&
    isBinaryContentType(mediaType);

  return isUndescribedBinary
    ? { ...schema, contentMediaType: mediaType }
    : schema;
};

const isNullSchema = (schema: unknown) =>
  typeof schema === "object" &&
  schema !== null &&
  "type" in schema &&
  schema.type === "null";

// `anyOf: [X, { type: "null" }]` is how OpenAPI 3.1 writes a nullable X (the
// 3.0 upgrade turns `nullable: true` next to a `$ref` or `allOf` into it).
// Unwrap it, so it renders as X with a `null` type instead of as a union.
export const unwrapNullableUnion = (
  schema: SchemaObject,
): { schema: SchemaObject; nullable: boolean } => {
  if (typeof schema !== "object" || schema.type || schema.properties) {
    return { schema, nullable: false };
  }

  const variants = schema.anyOf ?? schema.oneOf;
  const nonNullVariants = variants?.filter((v) => !isNullSchema(v)) ?? [];
  const [variant] = nonNullVariants;
  if (variants?.length !== 2 || nonNullVariants.length !== 1 || !variant) {
    return { schema, nullable: false };
  }

  // Circular refs arrive as strings, there is nothing to merge them with
  if (typeof variant !== "object") return { schema: variant, nullable: true };

  const { anyOf: _anyOf, oneOf: _oneOf, ...rest } = schema;
  return { schema: { ...variant, ...rest }, nullable: true };
};

export const isComplexType = (value?: SchemaObject) =>
  value &&
  ((value.type === "object" &&
    Object.keys(value.properties ?? {}).length > 0) ||
    (value.type === "array" &&
      typeof value.items === "object" &&
      ((!value.items.type && !isBinarySchema(value.items)) ||
        value.items.type === "object")));

export const isCircularRef = (schema: unknown): schema is string =>
  typeof schema === "string" &&
  (schema.startsWith(CIRCULAR_REF) || schema.startsWith(SCHEMA_REF_PREFIX));

export const isArrayCircularRef = (
  schema: SchemaObject,
): schema is SchemaObject & { items: SchemaObject } =>
  isArrayType(schema) && "items" in schema && isCircularRef(schema.items);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Reads `x-enumDescriptions` / `x-enum-descriptions` (enum value → description).
// Also accepts the map nested under `values`, or a string array aligned
// positionally with `enum` (as emitted by e.g. openapi-generator).
export const getEnumDescriptions = (
  schema?: SchemaObject,
): Record<string, string> | undefined => {
  if (!isRecord(schema)) return;
  const raw = schema["x-enumDescriptions"] ?? schema["x-enum-descriptions"];

  const entries: [string, unknown][] = Array.isArray(raw)
    ? (Array.isArray(schema.enum) ? schema.enum : []).map((value, i) => [
        String(value),
        raw[i] || undefined,
      ])
    : isRecord(raw)
      ? Object.entries(isRecord(raw.values) ? raw.values : raw)
      : [];
  const filtered = entries.filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );

  return filtered.length > 0 ? Object.fromEntries(filtered) : undefined;
};

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
