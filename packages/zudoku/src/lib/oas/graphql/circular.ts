import { GraphQLJSON } from "graphql-type-json";
import { GraphQLScalarType } from "graphql/index.js";
import { RecordAny } from "../../util/traverse.js";

export const CIRCULAR_REF = "$[Circular Reference]";

const handleCircularRefs = (
  obj: any,
  visited = new Map<string, string[]>(),
  path: string[] = [],
): any => {
  if (obj === CIRCULAR_REF) return CIRCULAR_REF;
  if (obj === null || typeof obj !== "object") return obj;

  const currentPath = path.join(".");

  if (obj.type === "object" && obj.properties) {
    const schemaKey = Object.keys(obj.properties).sort().join("-");

    if (visited.has(schemaKey)) {
      const prevPaths = visited.get(schemaKey)!;
      if (prevPaths.some((prev) => currentPath.startsWith(prev))) {
        return CIRCULAR_REF;
      }
      visited.set(schemaKey, [...prevPaths, currentPath]);
    } else {
      visited.set(schemaKey, [currentPath]);
    }
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) =>
      handleCircularRefs(item, visited, [...path, `${index}`]),
    );
  }

  const result: RecordAny = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = handleCircularRefs(value, visited, [...path, key]);
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
