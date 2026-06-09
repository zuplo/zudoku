type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

function inferType(value: JsonValue, indentation = ""): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "any[]";
    const firstValue = value[0];
    if (firstValue === undefined) return "any[]";
    const elementType = inferType(firstValue, indentation);
    return `${elementType}[]`;
  }
  if (typeof value === "object") {
    return generateInterface(value, indentation);
  }
  return typeof value;
}

export function generateInterface(obj: JsonObject, indentation = ""): string {
  const inner = `${indentation}  `;
  const lines: string[] = ["{"];

  for (const [key, value] of Object.entries(obj)) {
    const propertyType = inferType(value, inner);
    lines.push(`${inner}${key}: ${propertyType};`);
  }

  lines.push(`${indentation}}`);
  return lines.join("\n");
}

const toValidIdentifier = (name: string): string | undefined => {
  // PascalCase the name, dropping non-alphanumeric separators.
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
