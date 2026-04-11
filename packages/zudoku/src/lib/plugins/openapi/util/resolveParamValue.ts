import type { ParameterItem } from "../graphql/graphql.js";

export type PrefillMode = "example" | "default" | "none";

export const getSchemaExample = (schema: ParameterItem["schema"]): unknown => {
  if (!schema) return undefined;
  if (schema.example !== undefined) return schema.example;
  if (Array.isArray(schema.examples) && schema.examples.length > 0) {
    return schema.examples[0];
  }
  return undefined;
};

export const resolveParamValue = (
  param: Pick<ParameterItem, "schema" | "examples">,
  mode: PrefillMode,
): unknown => {
  if (mode === "none") return undefined;

  const schemaExample = getSchemaExample(param.schema);
  const paramExample = param.examples?.find((x) => x.value)?.value;
  const schemaDefault = param.schema?.default;

  if (mode === "example") {
    return schemaExample ?? paramExample ?? schemaDefault;
  }

  // "default" — backwards-compatible behaviour
  return schemaDefault ?? paramExample ?? schemaExample;
};
