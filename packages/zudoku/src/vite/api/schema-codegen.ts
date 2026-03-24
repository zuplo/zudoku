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

  traverse(obj, (node) => {
    if (typeof node.$ref === "string" && node.$ref.startsWith("#/")) {
      if (!refMap.has(node.$ref)) {
        refMap.set(node.$ref, refMap.size);
      }

      const { $ref, ...siblings } = node;

      if (Object.keys(siblings).length > 0) {
        const uniqueKey = `${$ref}__${siblingsMap.size}`;
        siblingsMap.set(uniqueKey, { refPath: $ref, siblings });
        node.__uniqueRefKey = uniqueKey;
      }
    }
    return node;
  });

  return { refMap, siblingsMap };
};

// Replace $ref nodes with markers that become JS variable references
const setRefMarkers = (obj: RecordAny, refMap: Map<string, number>) =>
  traverse(obj, (node) => {
    const { $ref, __uniqueRefKey } = node;
    if (typeof $ref === "string" && refMap.has($ref)) {
      return __uniqueRefKey
        ? `__refMap+Siblings:${__uniqueRefKey}`
        : `__refMap:${$ref}`;
    }
    return node;
  });

// Replace ref markers in generated code with actual variable references
const replaceMarkers = (code: string, mergedRefs: Map<string, string>) =>
  code
    .replace(/"__refMap:(.*?)"/g, '__refMap["$1"]')
    .replace(
      /"__refMap\+Siblings:(.*?)"/g,
      (_, key) => mergedRefs.get(key) ?? `__refMap["${key}"]`,
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

const stringify = (obj: unknown, indent = 2) =>
  JSON.stringify(obj, null, indent);

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
export const generateCode = (schema: RecordAny, filePath?: string) => {
  const { refMap, siblingsMap } = createLocalRefMap(schema);
  const lines: string[] = [];

  lines.push(
    `const __refs = Array.from({ length: ${refMap.size} }, () => ({}));`,
    "const __refMap = {",
    Array.from(refMap)
      .map(([refPath, index]) => `  "${refPath}": __refs[${index}]`)
      .join(",\n"),
    "};",
    "const __refMapPaths = Object.keys(__refMap);",
  );

  // Pre-declare merged ref variables as empty objects so they can be referenced
  // during base ref population (they get populated after)
  const mergedRefs = new Map<string, string>();

  for (const uniqueKey of siblingsMap.keys()) {
    const varName = `__merged_${mergedRefs.size}`;
    mergedRefs.set(uniqueKey, varName);
    lines.push(`const ${varName} = {};`);
  }

  const toCode = (obj: RecordAny) =>
    replaceMarkers(stringify(setRefMarkers(obj, refMap)), mergedRefs);

  // Pass 1: Populate all base refs. Bare $ref+siblings aliases are deferred
  // until all regular base refs are populated (ordering is DFS-dependent).
  const deferred: string[] = [];
  for (const [refPath, index] of refMap) {
    const value = lookup(schema, refPath, filePath);

    if (!value) {
      // biome-ignore lint/suspicious/noConsole: Logging allowed here
      console.warn(`Could not find value for refPath: ${refPath}`);
      continue;
    }

    const siblingEntry =
      value.__uniqueRefKey && siblingsMap.get(value.__uniqueRefKey);
    const target = siblingEntry ? deferred : lines;

    target.push(
      siblingEntry
        ? `Object.assign(__refs[${index}], __refMap["${siblingEntry.refPath}"], ${stringify(siblingEntry.siblings)});`
        : `Object.assign(__refs[${index}], ${toCode(value)});`,
      `Object.defineProperty(__refs[${index}], "__$ref", { value: __refMapPaths[${index}], enumerable: false });`,
    );
  }
  lines.push(...deferred);

  // Pass 2: Populate merged objects (refs with sibling overrides like description)
  for (const [uniqueKey, { refPath, siblings }] of siblingsMap) {
    const varName = mergedRefs.get(uniqueKey);
    const refIndex = refMap.get(refPath);
    lines.push(
      `Object.assign(${varName}, __refMap["${refPath}"], ${stringify(siblings)});`,
      `Object.defineProperty(${varName}, "__$ref", { value: __refMapPaths[${refIndex}], enumerable: false });`,
    );
  }

  const finalCode = toCode(schema);

  lines.push(`export const schema = ${finalCode};`);

  return lines.join("\n");
};
