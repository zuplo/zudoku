type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

function inferType(value: JsonValue): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "any[]";
    const firstValue = value[0];
    if (firstValue === undefined) return "any[]";
    const elementType = inferType(firstValue);
    return `${elementType}[]`;
  }
  if (typeof value === "object") {
    return generateInterface(value);
  }
  return typeof value;
}

export function generateInterface(obj: JsonObject, _indentation = ""): string {
  const lines: string[] = ["{"];

  for (const [key, value] of Object.entries(obj)) {
    const propertyType = inferType(value);
    lines.push(`  ${key}: ${propertyType};`);
  }

  lines.push("}");
  return lines.join("\n");
}

const toValidIdentifier = (name: string): string | undefined => {
  // PascalCase: split on non-alphanumeric, capitalize each part
  const sanitized = name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  if (!sanitized || /^\d/.test(sanitized)) return undefined;

  return sanitized;
};

export function convertToTypes(
  json: JsonValue,
  typeName?: string,
): { lines: string[] } {
  const name =
    (typeName ? toValidIdentifier(typeName) : undefined) ?? "GeneratedType";
  const typeDefinition = inferType(json);
  const lines = [`type ${name} = ${typeDefinition};`];
  return { lines };
}
