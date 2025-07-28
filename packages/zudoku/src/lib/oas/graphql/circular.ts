import { GraphQLScalarType } from "graphql/index.js";
import { GraphQLJSON } from "graphql-type-json";
import type { RecordAny } from "../../util/traverse.js";

export const CIRCULAR_REF = "$[Circular Reference]";

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
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
): any => {
  if (obj === null || typeof obj !== "object") return obj;

  if (visited.has(obj)) {
    const cached = refs.get(obj);
    if (cached) return cached;
    const circularProp = path.find((p) => !OPENAPI_PROPS.has(p)) || path[0];

    return [CIRCULAR_REF, circularProp].filter(Boolean).join(":");
  }

  visited.add(obj);

  if (Array.isArray(obj)) {
    const result = obj.map((item, index) =>
      handleCircularRefs(item, visited, refs, [...path, index.toString()]),
    );
    refs.set(obj, result);
    return result;
  }

  const result: RecordAny = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = handleCircularRefs(value, visited, refs, [...path, key]);
  }
  refs.set(obj, result);
  return result;
};

export const GraphQLJSONSchema = new GraphQLScalarType({
  ...GraphQLJSON,
  name: "JSONSchema",
  description: "OpenAPI schema scalar type that handles circular references",
  serialize: (value: unknown) =>
    GraphQLJSON.serialize(handleCircularRefs(value)),
});
