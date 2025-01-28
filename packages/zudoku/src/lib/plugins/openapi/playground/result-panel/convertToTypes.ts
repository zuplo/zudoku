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

export function generateInterface(obj: JsonObject, indentation = ""): string {
  const lines: string[] = ["{"];

  for (const [key, value] of Object.entries(obj)) {
    const propertyType = inferType(value);
    lines.push(`  ${key}: ${propertyType};`);
  }

  lines.push("}");
  return lines.join("\n");
}

export function convertToTypes(json: JsonValue): { lines: string[] } {
  const typeDefinition = inferType(json);
  const lines = [`type GeneratedType = ${typeDefinition};`];
  return { lines };
}
