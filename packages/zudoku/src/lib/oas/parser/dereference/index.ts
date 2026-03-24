import type { JSONSchema4, JSONSchema6 } from "json-schema";
import { CIRCULAR_REF } from "../../graphql/constants.js";
import { resolveLocalRef } from "./resolveRef.js";

export type JSONSchema = JSONSchema4 | JSONSchema6;

type CustomResolver = (ref: string) => Promise<JSONSchema | undefined>;

const cache = new Map<JSONSchema, JSONSchema>();

// biome-ignore lint/suspicious/noExplicitAny: Allow any type
const isIndexableObject = (obj: any): obj is Record<string, any> =>
  obj !== null && typeof obj === "object";

// Taken and inspired from `dereference-json-schema` package.
export const dereference = async (
  schema: JSONSchema,
  resolvers: CustomResolver[] = [],
) => {
  if (cache.has(schema)) {
    // biome-ignore lint/style/noNonNullAssertion: Cache is guaranteed to have a value
    return cache.get(schema)!;
  }

  const cloned = structuredClone(schema);
  const visited = new Set<unknown>();

  const resolve = async (current: unknown, path: string) => {
    if (isIndexableObject(current)) {
      if (visited.has(current)) {
        return CIRCULAR_REF;
      }

      visited.add(current);

      if (Array.isArray(current)) {
        for (let index = 0; index < current.length; index++) {
          current[index] = await resolve(current[index], `${path}/${index}`);
        }
      } else {
        if ("$ref" in current && typeof current.$ref === "string") {
          const { $ref, ...siblings } = current;
          current.__$ref = $ref;
          const hasSiblings = Object.keys(siblings).length > 0;

          let result: unknown;
          for (const resolver of resolvers) {
            const resolved = await resolver($ref);
            if (resolved) {
              result = await resolve(resolved, path);
              break;
            }
          }
          if (result === undefined) {
            const resolved = await resolveLocalRef(cloned, $ref);
            result = await resolve(resolved, path);
          }

          if (hasSiblings) {
            if (result === CIRCULAR_REF) {
              return { ...siblings };
            }
            if (isIndexableObject(result)) {
              return { ...result, ...siblings };
            }
          }
          return result;
        }

        for (const key in current) {
          current[key] = await resolve(current[key], `${path}/${key}`);
        }
      }

      visited.delete(current);
    }

    return current;
  };

  const result = (await resolve(cloned, "#")) as JSONSchema;
  cache.set(schema, result);
  return result;
};
