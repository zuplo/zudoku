import { GraphQLJSON } from "graphql-type-json";
import { GraphQLScalarType } from "graphql/index.js";

export const CIRCULAR_REF = "$[Circular Reference]";
const handleCircularRefs = (obj: any, visited = new WeakSet()): any => {
  if (obj === CIRCULAR_REF) return CIRCULAR_REF;
  if (obj === null || typeof obj !== "object") return obj;

  if (visited.has(obj)) return CIRCULAR_REF;

  visited.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => handleCircularRefs(item, visited));
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = handleCircularRefs(value, visited);
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
