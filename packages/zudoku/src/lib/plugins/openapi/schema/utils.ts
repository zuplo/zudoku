import type { SchemaObject } from "../../../oas/parser/index.js";

export const isComplexType = (value: SchemaObject) =>
  value.type === "object" ||
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
