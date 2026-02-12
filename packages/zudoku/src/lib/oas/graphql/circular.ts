import { GraphQLScalarType } from "graphql/index.js";
import { GraphQLJSON } from "graphql-type-json";

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

export const handleCircularRefs = (
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
  obj: any,
  currentPath = new WeakSet(),
  refs = new WeakMap(),
  path: string[] = [],
  currentRefPaths = new Set<string>(),
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type
): any => {
  if (obj === null || typeof obj !== "object") return obj;

  const refPath = obj.__$ref;
  const isCircular =
    currentPath.has(obj) ||
    (typeof refPath === "string" && currentRefPaths.has(refPath));

  if (isCircular) {
    if (typeof refPath === "string") return SCHEMA_REF_PREFIX + refPath;
    const circularProp = path.find((p) => !OPENAPI_PROPS.has(p)) || path[0];
    return [CIRCULAR_REF, circularProp].filter(Boolean).join(":");
  }

  if (refs.has(obj)) return refs.get(obj);

  currentPath.add(obj);
  if (typeof refPath === "string") currentRefPaths.add(refPath);

  const recurse = (value: unknown, key: string) =>
    handleCircularRefs(
      value,
      currentPath,
      refs,
      [...path, key],
      currentRefPaths,
    );

  const result = Array.isArray(obj)
    ? obj.map((item, i) => recurse(item, i.toString()))
    : Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, recurse(v, k)]),
      );

  refs.set(obj, result);
  currentPath.delete(obj);
  if (typeof refPath === "string") currentRefPaths.delete(refPath);

  return result;
};

export const GraphQLJSONSchema = new GraphQLScalarType({
  ...GraphQLJSON,
  name: "JSONSchema",
  description: "OpenAPI schema scalar type that handles circular references",
  serialize: (value: unknown) =>
    GraphQLJSON.serialize(handleCircularRefs(value)),
});
