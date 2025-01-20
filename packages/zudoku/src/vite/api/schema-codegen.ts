import { type RecordAny, traverse } from "../../lib/util/traverse.js";

// Find all $ref occurrences in the schema and assign them unique variable names
const createLocalRefMap = (obj: RecordAny) => {
  const refMap = new Map<string, number>();
  let refCounter = 0;

  traverse(obj, (node) => {
    if (typeof node.$ref === "string" && node.$ref.startsWith("#/")) {
      if (!refMap.has(node.$ref)) {
        refMap.set(node.$ref, refCounter++);
      }
    }
    return node;
  });

  return refMap;
};

// Replace all $ref occurrences with a special marker that will be transformed into a reference to the __refMap lookup
const setRefMarkers = (obj: RecordAny, refMap: Map<string, number>) =>
  traverse<string | RecordAny>(obj, (node) => {
    if (node.$ref && typeof node.$ref === "string" && refMap.has(node.$ref)) {
      return `__refMap:${node.$ref}`;
    }
    return node;
  });

// Replace the marker strings with actual __refMap lookups in the generated code
const replaceRefMarkers = (code: string) =>
  code.replace(/"__refMap:(.*?)"/g, '__refMap["$1"]');

const lookup = (schema: RecordAny, path: string) => {
  const parts = path.split("/").slice(1);
  let value = schema;

  for (const part of parts) {
    value = value[part];
  }

  return value;
};

/**
 * Generate JavaScript code that exports the schema with all references resolved as variables.
 *
 * Handles circular references by:
 * 1. Creating empty objects first to establish the references
 * 2. Adding these objects to the reference map
 * 3. Using Object.assign to populate their properties later
 *
 * This ensures object identity throughout the circular references.
 */
export const generateCode = async (schema: RecordAny) => {
  const refMap = createLocalRefMap(schema);
  const lines: string[] = [];

  const str = (obj: unknown) => JSON.stringify(obj, null, 2);

  lines.push(
    `const __refs = Array.from({ length: ${refMap.size} }, () => ({}));`,
  );

  lines.push(
    "const __refMap = {",
    Array.from(refMap)
      .map(([refPath, index]) => `  "${refPath}": __refs[${index}]`)
      .join(",\n"),
    "};",
  );

  for (const [refPath, index] of refMap) {
    const value = lookup(schema, refPath);
    const transformedValue = setRefMarkers(value, refMap);

    lines.push(
      // Use assign so that the object identity is maintained and correctly resolves circular references
      `Object.assign(__refs[${index}], ${replaceRefMarkers(str(transformedValue))});`,
    );
  }

  const transformed = setRefMarkers(schema, refMap);
  lines.push(`export const schema = ${replaceRefMarkers(str(transformed))};`);

  return lines.join("\n");
};
