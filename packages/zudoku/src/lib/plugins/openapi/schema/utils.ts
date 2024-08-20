import type { SchemaObject } from "../../../oas/parser/index.js";

export const isComplexType = (value: SchemaObject) =>
  value.type === "object" ||
  (value.type === "array" &&
    typeof value.items === "object" &&
    (!value.items?.type || value.items?.type === "object"));

export const hasLogicalGroupings = (value: SchemaObject) =>
  value.oneOf || value.allOf || value.anyOf;
