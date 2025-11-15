import type { SchemaObject } from "../../../oas/parser/index.js";

export type FieldSignature = {
  type?: SchemaObject["type"];
  const?: unknown;
  enum?: unknown[];
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean | number;
  exclusiveMaximum?: boolean | number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  itemsType?: string | string[];
  additionalProps?: "true" | "false" | "schema";
};

export type FieldDoc = {
  name: string;
  humanType: string;
  description?: string;
  requiredInAll: boolean;
};

export const unionVariants = (schema: SchemaObject): SchemaObject[] => {
  const variants = (schema.oneOf ?? schema.anyOf ?? []) as SchemaObject[];

  // If parent schema has properties that variants don't, merge them
  // This handles the pattern where anyOf/oneOf is used just for required field combinations
  if (schema.properties && Object.keys(schema.properties).length > 0) {
    return variants.map((variant) => {
      // If variant doesn't define its own properties or type, inherit from parent
      const shouldInherit =
        !variant.properties &&
        !variant.type &&
        !variant.oneOf &&
        !variant.anyOf;

      if (shouldInherit) {
        return {
          ...variant,
          type: "object" as const,
          properties: schema.properties,
          required: variant.required ?? schema.required,
        };
      }

      return variant;
    });
  }

  return variants;
};

export const decideExclusivity = (
  schema: SchemaObject,
): "exactly-one" | "at-least-one" => {
  if (Array.isArray(schema.oneOf)) return "exactly-one";

  const discriminator = schema.discriminator?.propertyName;
  if (!discriminator) return "at-least-one";

  const variants = unionVariants(schema);
  const seen = new Set<string>();

  for (const variant of variants) {
    const prop = variant.properties?.[discriminator];

    const value =
      prop?.const ??
      (Array.isArray(prop?.enum) && prop.enum.length === 1
        ? String(prop.enum[0])
        : undefined);

    if (value == null || seen.has(String(value))) return "at-least-one";
    seen.add(String(value));
  }

  return "exactly-one";
};

export const labelForVariant = (index: number, variant: SchemaObject) =>
  variant.title?.trim() || `Variant ${index + 1}`;

export const quickGuards = (variant: SchemaObject, root?: SchemaObject) => {
  const guards: string[] = [];

  if (variant.type) {
    guards.push(
      `type = ${Array.isArray(variant.type) ? variant.type.join("|") : variant.type}`,
    );
  }

  const discriminator = root?.discriminator?.propertyName;
  if (discriminator) {
    const discriminatorProp = variant.properties?.[discriminator] as
      | SchemaObject
      | undefined;

    const discriminatorValue =
      discriminatorProp?.const ??
      (Array.isArray(discriminatorProp?.enum) &&
      discriminatorProp.enum.length === 1
        ? discriminatorProp.enum[0]
        : undefined);

    if (discriminatorValue !== undefined) {
      guards.push(`${discriminator}=${JSON.stringify(discriminatorValue)}`);
    }
  }

  const required = (variant.required ?? []).filter((k) => k !== discriminator);
  if (required.length) {
    const head = required.slice(0, 3).join(", ");
    const more = required.length > 3 ? ` +${required.length - 3} more` : "";
    guards.push(`requires: ${head}${more}`);
  }

  return guards;
};
