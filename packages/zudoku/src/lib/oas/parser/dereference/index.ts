import type { JSONSchema4, JSONSchema6 } from "json-schema";
import { resolveLocalRef } from "./resolveRef.js";

export type JSONSchema = JSONSchema4 | JSONSchema6;

type CustomResolver = (ref: string) => Promise<JSONSchema | undefined>;

const cache = new Map<JSONSchema, JSONSchema>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isIndexableObject = (obj: any): obj is Record<string, any> =>
  obj !== null && typeof obj === "object";

// Taken and inspired from `dereference-json-schema` package.
export const dereference = async (
  schema: JSONSchema,
  resolvers: CustomResolver[] = [],
) => {
  if (cache.has(schema)) {
    return cache.get(schema)!;
  }

  const cloned = structuredClone(schema);
  const visited = new Set();

  const resolve = async (current: unknown, path: string) => {
    if (isIndexableObject(current)) {
      if (visited.has(current)) {
        return current;
      }

      visited.add(current);

      if (Array.isArray(current)) {
        for (let index = 0; index < current.length; index++) {
          current[index] = await resolve(current[index], `${path}/${index}`);
        }
      } else {
        if ("$ref" in current && typeof current.$ref === "string") {
          for (const resolver of resolvers) {
            const resolved = await resolver(current.$ref);
            if (resolved) return resolved;
          }
          return await resolveLocalRef(cloned, current.$ref);
        }

        for (const key in current) {
          current[key] = await resolve(current[key], `${path}/${key}`);
        }
      }
    }

    return current;
  };

  const result = (await resolve(cloned, "#")) as JSONSchema;
  cache.set(schema, result);
  return result;
};
