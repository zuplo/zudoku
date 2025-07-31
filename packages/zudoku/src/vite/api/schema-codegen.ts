import { $RefParser } from "@apidevtools/json-schema-ref-parser";
import { getAllOperations, getAllSlugs } from "../../lib/oas/graphql/index.js";
import type { OpenAPIDocument } from "../../lib/oas/parser/index.js";
import { type RecordAny, traverse } from "../../lib/util/traverse.js";

const unescapeJsonPointer = (uri: string) =>
  decodeURIComponent(uri.replace(/~1/g, "/").replace(/~0/g, "~"));

const getSegmentsFromPath = (path: string) =>
  path.split("/").slice(1).map(unescapeJsonPointer);

// Find all $ref occurrences in the schema and assign them unique variable names
const createLocalRefMap = (obj: RecordAny) => {
  const refMap = new Map<string, number>();
  const siblingsMap = new Map<string, RecordAny>();
  let refCounter = 0;
  let siblingCounter = 0;

  traverse(obj, (node) => {
    if (typeof node.$ref === "string" && node.$ref.startsWith("#/")) {
      if (!refMap.has(node.$ref)) {
        refMap.set(node.$ref, refCounter++);
      }

      const { $ref, description, summary } = node;

      if (description || summary) {
        const siblings = { description, summary };
        const uniqueKey = `${$ref}__${siblingCounter++}`;
        siblingsMap.set(uniqueKey, { refPath: $ref, siblings });

        // Replace the node's $ref with our unique key so we can track it
        node.__uniqueRefKey = uniqueKey;
      }
    }
    return node;
  });

  return { refMap, siblingsMap };
};

// Replace all $ref occurrences with a special marker that will be transformed into a reference to the __refMap lookup
const setRefMarkers = (
  obj: RecordAny,
  refMap: Map<string, number>,
  siblingsMap: Map<string, RecordAny>,
) =>
  traverse<string | RecordAny>(obj, (node) => {
    const { $ref, __uniqueRefKey } = node;
    if ($ref && typeof $ref === "string" && refMap.has($ref)) {
      if (__uniqueRefKey && siblingsMap.has(__uniqueRefKey)) {
        return `__refMap+Siblings:${__uniqueRefKey}`;
      } else {
        return `__refMap:${$ref}`;
      }
    }
    return node;
  });

// Replace the marker strings with actual __refMap lookups in the generated code
const replaceRefMarkers = (
  code?: string,
  siblingsMap?: Map<string, RecordAny>,
) => {
  if (!code) return code;

  // Handle simple refs
  code = code.replace(/"__refMap:(.*?)"/g, '__refMap["$1"]');

  // Handle refs with siblings
  code = code.replace(/"__refMap\+Siblings:(.*?)"/g, (_, uniqueKey) => {
    const entry = siblingsMap?.get(uniqueKey);
    // Fallback to the simple ref if no siblings are found
    if (!entry) return `__refMap["${uniqueKey}"]`;

    const { refPath, siblings } = entry;
    return `Object.assign({}, __refMap["${refPath}"], ${JSON.stringify(siblings)}, { __$ref: __refMap["${refPath}"].__$ref })`;
  });

  return code;
};

const lookup = (
  schema: RecordAny,
  path: string,
  filePath?: string,
): RecordAny => {
  const parts = getSegmentsFromPath(path);
  let val = schema;

  for (const part of parts) {
    while (val.$ref?.startsWith("#/")) {
      val = val.$ref === path ? val : lookup(schema, val.$ref, filePath);
    }

    if (val[part] === undefined) {
      throw new Error(
        `Error in ${filePath ?? "code generation"}: Could not find path segment ${part} in path: ${path}`,
      );
    }

    val = val[part];
  }

  return val;
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
export const generateCode = async (schema: RecordAny, filePath?: string) => {
  const { refMap, siblingsMap } = createLocalRefMap(schema);
  const lines: string[] = [];

  const str = (obj: unknown, indent = 2) => JSON.stringify(obj, null, indent);

  lines.push(
    `const __refs = Array.from({ length: ${refMap.size} }, () => ({}));`,
  );

  lines.push(
    "const __refMap = {",
    Array.from(refMap)
      .map(([refPath, index]) => `  "${refPath}": __refs[${index}]`)
      .join(",\n"),
    "};",
    "const __refMapPaths = Object.keys(__refMap);",
  );

  for (const [refPath, index] of refMap) {
    const value = lookup(schema, refPath, filePath);

    // This shouldn't happen but to be safe we log a warning
    if (!value) {
      // biome-ignore lint/suspicious/noConsole: Logging allowed here
      console.warn(`Could not find value for refPath: ${refPath}`);
      continue;
    }

    const transformedValue = setRefMarkers(value, refMap, siblingsMap);

    lines.push(
      // Use assign so that the object identity is maintained and correctly resolves circular references
      `Object.assign(__refs[${index}], ${replaceRefMarkers(str(transformedValue), siblingsMap)});`,
      `Object.defineProperty(__refs[${index}], "__$ref", { value: __refMapPaths[${index}], enumerable: false });`,
    );
  }

  const transformed = setRefMarkers(schema, refMap, siblingsMap);
  lines.push(
    `export const schema = ${replaceRefMarkers(str(transformed), siblingsMap)};`,
  );

  // slugify is quite expensive for big schemas, so we pre-generate the slugs here to shave off time
  const dereferencedSchema = await $RefParser.dereference<OpenAPIDocument>(
    schema,
    { dereference: { preservedProperties: ["description", "summary"] } },
  );
  const slugs = getAllSlugs(
    getAllOperations(dereferencedSchema.paths),
    dereferencedSchema.tags,
  );

  lines.push(`export const slugs = {`);
  lines.push(
    `  operations: ${str(slugs.operations, 0)},`,
    `  tags: ${str(slugs.tags, 0)},`,
  );
  lines.push(`};`);

  return lines.join("\n");
};
