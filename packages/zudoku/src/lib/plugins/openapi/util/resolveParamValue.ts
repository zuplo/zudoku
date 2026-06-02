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

/**
 * Resolves the value used to pre-fill a single playground parameter field,
 * based on the configured {@link PrefillMode}.
 *
 * Both `"example"` and `"default"` fall back to the other source so as many
 * fields as possible get pre-filled — they only differ in which value wins
 * when both are present:
 *
 * - `"example"` – `schema.example`/`examples` → parameter example → `schema.default`
 * - `"default"` – `schema.default` → parameter example → `schema.example`/`examples`
 * - `"none"` – nothing
 */
export const resolveParamValue = (
  param: Pick<ParameterItem, "schema" | "examples">,
  mode: PrefillMode,
): unknown => {
  if (mode === "none") return undefined;

  const schemaExample = getSchemaExample(param.schema);
  const paramExample = param.examples?.find((x) => x.value != null)?.value;
  const schemaDefault = param.schema?.default;

  if (mode === "example") {
    return schemaExample ?? paramExample ?? schemaDefault;
  }

  // "default" — prefer schema.default, fall back to examples
  return schemaDefault ?? paramExample ?? schemaExample;
};

/**
 * Serializes a resolved parameter value into the string the playground input
 * expects. Arrays and objects are JSON-encoded; primitives are stringified.
 */
export const stringifyParamValue = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};
