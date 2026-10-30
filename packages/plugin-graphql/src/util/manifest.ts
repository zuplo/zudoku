import type { IntrospectionQuery } from "graphql";
import type { RootType } from "./types.js";

// Names-only schema outline. Small enough to ship in the entry bundle so routes
// and navigation can be built without loading the full introspection.
export type GraphQLManifest = Record<RootType, string[]>;

export const buildManifest = (
  introspection: IntrospectionQuery,
): GraphQLManifest => {
  const schema = introspection.__schema;

  const rootFieldNames = (typeName: string | null | undefined): string[] => {
    if (!typeName) return [];
    const type = schema.types.find(
      (t) => t.name === typeName && t.kind === "OBJECT",
    );
    return type && "fields" in type ? type.fields.map((f) => f.name) : [];
  };

  const typeNames = (kind: string): string[] =>
    schema.types
      .filter((t) => !t.name.startsWith("__") && t.kind === kind)
      .map((t) => t.name);

  const rootNames = new Set(
    [
      schema.queryType?.name,
      schema.mutationType?.name,
      schema.subscriptionType?.name,
    ].filter((name): name is string => Boolean(name)),
  );

  return {
    query: rootFieldNames(schema.queryType?.name),
    mutation: rootFieldNames(schema.mutationType?.name),
    subscription: rootFieldNames(schema.subscriptionType?.name),
    object: typeNames("OBJECT").filter((name) => !rootNames.has(name)),
    input: typeNames("INPUT_OBJECT"),
    enum: typeNames("ENUM"),
    scalar: typeNames("SCALAR"),
    interface: typeNames("INTERFACE"),
    union: typeNames("UNION"),
  };
};
