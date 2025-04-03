import { CIRCULAR_REF } from "../../../oas/graphql/circular.js";
import type { SchemaObject } from "../../../oas/parser/index.js";

export const isBasicType = (
  type: unknown,
): type is "string" | "number" | "boolean" | "integer" | "null" =>
  typeof type === "string" &&
  ["string", "number", "boolean", "integer", "null"].includes(type);

export const isComplexType = (value: SchemaObject) =>
  (value.type === "object" && Object.keys(value.properties ?? {}).length > 0) ||
  (value.type === "array" &&
    typeof value.items === "object" &&
    (!value.items.type || value.items.type === "object"));

export const hasLogicalGroupings = (value: SchemaObject) =>
  Boolean(value.oneOf ?? value.allOf ?? value.anyOf);

export const LogicalSchemaTypeMap = {
  allOf: "AND",
  anyOf: "OR",
  oneOf: "ONE",
} as const;

export type LogicalGroupType = "AND" | "OR" | "ONE";

export const isCircularRef = (schema: unknown): schema is string =>
  schema === CIRCULAR_REF;
