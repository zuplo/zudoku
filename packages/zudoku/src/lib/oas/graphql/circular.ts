import { GraphQLScalarType } from "graphql/index.js";
import { GraphQLJSON } from "graphql-type-json";
import type { RecordAny } from "../../util/traverse.js";

export const CIRCULAR_REF = "$[Circular Reference]";
export const SCHEMA_REF_PREFIX = "$ref:";

const OPENAPI_PROPS = new Set([
  "properties",
  "items",
  "additionalProperties",
  "allOf",
  "anyOf",
  "oneOf",
]);

const handleCircularRefs = (
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  obj: any,
  visited = new WeakSet(),
  refs = new WeakMap(),
  path: string[] = [],
  seenRefPaths = new Set<string>(),
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
): any => {
  if (obj === null || typeof obj !== "object") return obj;

  const refPath = obj.__$ref;
  
  // Check if this object has a __$ref marker (set during schema code generation)
  // If we've already fully processed this ref path, return a reference marker
  // instead of the full data to avoid JSON.stringify serializing duplicates
  if (typeof refPath === "string" && seenRefPaths.has(refPath)) {
    return SCHEMA_REF_PREFIX + refPath;
  }

  if (visited.has(obj)) {
    const cached = refs.get(obj);
    if (cached) {
      return typeof refPath === "string"
        ? // If already processed, return ref marker to avoid duplicate serialization
          SCHEMA_REF_PREFIX + refPath
        : cached;
    }
    const circularProp = path.find((p) => !OPENAPI_PROPS.has(p)) || path[0];

    return [CIRCULAR_REF, circularProp].filter(Boolean).join(":");
  }

  visited.add(obj);

  if (Array.isArray(obj)) {
    const result = obj.map((item, index) =>
      handleCircularRefs(
        item,
        visited,
        refs,
        [...path, index.toString()],
        seenRefPaths,
      ),
    );
    refs.set(obj, result);
    return result;
  }

  const result: RecordAny = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = handleCircularRefs(
      value,
      visited,
      refs,
      [...path, key],
      seenRefPaths,
    );
  }
  refs.set(obj, result);

  if (typeof refPath === "string") {
    seenRefPaths.add(refPath);
  }

  return result;
};

export const GraphQLJSONSchema = new GraphQLScalarType({
  ...GraphQLJSON,
  name: "JSONSchema",
  description: "OpenAPI schema scalar type that handles circular references",
  serialize: (value: unknown) =>
    GraphQLJSON.serialize(handleCircularRefs(value)),
});
