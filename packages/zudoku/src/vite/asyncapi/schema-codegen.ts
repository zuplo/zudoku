import { $RefParser } from "@apidevtools/json-schema-ref-parser";
import {
  getAllOperations,
  getAllSlugs,
} from "../../lib/asyncapi/graphql/index.js";
import type { AsyncAPIDocument } from "../../lib/asyncapi/types.js";
import { type RecordAny, traverse } from "../../lib/util/traverse.js";

const unescapeJsonPointer = (uri: string) =>
  decodeURIComponent(uri.replace(/~1/g, "/").replace(/~0/g, "~"));

const getSegmentsFromPath = (path: string) =>
  path.split("/").slice(1).map(unescapeJsonPointer);

// Find all $ref occurrences in the schema and assign them unique variable names
const createLocalRefMap = (obj: RecordAny) => {
  const refMap = new Map<string, number>();
  const siblingsMap = new Map<
    string,
    { refPath: string; siblings: RecordAny }
  >();
  let refCounter = 0;
  let siblingCounter = 0;

  traverse(obj, (node) => {
    if (typeof node.$ref === "string" && node.$ref.startsWith("#/")) {
      if (!refMap.has(node.$ref)) {
        refMap.set(node.$ref, refCounter++);
      }

      const { $ref, ...otherProps } = node;

      // Check if there are sibling properties (anything besides $ref)
      if (Object.keys(otherProps).length > 0) {
        const uniqueKey = `${$ref}__${siblingCounter++}`;
        siblingsMap.set(uniqueKey, { refPath: $ref, siblings: otherProps });

        // Mark this node with the unique key so we can track it
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
  ignoreSiblings = false,
) =>
  traverse(obj, (node) => {
    const { $ref, __uniqueRefKey } = node;
    if ($ref && typeof $ref === "string" && refMap.has($ref)) {
      if (ignoreSiblings || !__uniqueRefKey) {
        return `__refMap:${$ref}`;
      }
      return `__refMap+Siblings:${__uniqueRefKey}`;
    }
    return node;
  });

// Replace simple ref markers with __refMap lookups
const replaceRefMarkers = (code: string) =>
  code.replace(/"__refMap:(.*?)"/g, '__refMap["$1"]');

// Replace sibling ref markers with merged variable names
const replaceSiblingRefMarkers = (
  code: string,
  mergedRefs: Map<string, string>,
) =>
  code.replace(
    /"__refMap\+Siblings:(.*?)"/g,
    (_, uniqueKey) => mergedRefs.get(uniqueKey) ?? `__refMap["${uniqueKey}"]`,
  );

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
 * Generate JavaScript code that exports the AsyncAPI schema with all references resolved as variables.
 *
 * Handles circular references by:
 * 1. Creating empty objects first to establish the references
 * 2. Adding these objects to the reference map
 * 3. Using Object.assign to populate their properties later
 *
 * This ensures object identity throughout the circular references.
 */
export const generateAsyncApiCode = async (
  schema: RecordAny,
  filePath?: string,
) => {
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

  // Pass 1: Populate all base refs (ignoring siblings temporarily)
  const assignBaseRefs = () => {
    for (const [refPath, index] of refMap) {
      const value = lookup(schema, refPath, filePath);

      if (!value) {
        // biome-ignore lint/suspicious/noConsole: Logging allowed here
        console.warn(`Could not find value for refPath: ${refPath}`);
        continue;
      }

      const transformedValue = setRefMarkers(value, refMap, true);

      lines.push(
        `Object.assign(__refs[${index}], ${replaceRefMarkers(str(transformedValue))});`,
        `Object.defineProperty(__refs[${index}], "__$ref", { value: __refMapPaths[${index}], enumerable: false });`,
      );
    }
  };

  // Pass 2: Create merged objects for refs with siblings
  const createMergedRefs = () => {
    if (siblingsMap.size === 0) return;

    const mergedRefs = new Map<string, string>();
    let mergedCounter = 0;

    for (const [uniqueKey, { refPath, siblings }] of siblingsMap) {
      const varName = `__merged_${mergedCounter++}`;
      mergedRefs.set(uniqueKey, varName);

      // Create merged object and preserve __$ref
      const refIndex = refMap.get(refPath);
      lines.push(
        `const ${varName} = Object.assign({}, __refMap["${refPath}"], ${str(siblings)});`,
        `Object.defineProperty(${varName}, "__$ref", { value: __refMapPaths[${refIndex}], enumerable: false });`,
      );
    }

    return mergedRefs;
  };

  assignBaseRefs();
  const mergedRefs = createMergedRefs();
  const transformed = setRefMarkers(schema, refMap);

  let finalCode = replaceRefMarkers(str(transformed));
  if (mergedRefs) finalCode = replaceSiblingRefMarkers(finalCode, mergedRefs);

  lines.push(`export const schema = ${finalCode};`);

  // Pre-generate slugs for AsyncAPI operations
  const dereferencedSchema = await $RefParser.dereference<AsyncAPIDocument>(
    schema,
    { dereference: { preservedProperties: ["description", "summary"] } },
  );

  const operations = getAllOperations(
    dereferencedSchema.operations,
    dereferencedSchema.channels,
    dereferencedSchema.servers,
  );
  const slugs = getAllSlugs(operations, dereferencedSchema.info?.tags);

  lines.push(`export const slugs = {`);
  lines.push(
    `  operations: ${str(slugs.operations, 0)},`,
    `  tags: ${str(slugs.tags, 0)},`,
  );
  lines.push(`};`);

  return lines.join("\n");
};
