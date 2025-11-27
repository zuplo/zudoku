import { CIRCULAR_REF } from "../../../oas/graphql/circular.js";
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
  typeof schema === "string" && schema.startsWith(CIRCULAR_REF);

export const isArrayCircularRef = (
  schema: SchemaObject,
): schema is SchemaObject & { items: SchemaObject } =>
  isArrayType(schema) && "items" in schema && isCircularRef(schema.items);

export const extractCircularRefInfo = (
  ref?: string | SchemaObject,
): string | undefined =>
  typeof ref === "string" ? ref.split(":")[1] : undefined;
