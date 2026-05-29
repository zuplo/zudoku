declare module "virtual:@zudoku/plugin-graphql/schema" {
  import type { IntrospectionQuery } from "graphql";
  import type { GraphQLManifest } from "./util/manifest.js";

  // Names-only outlines keyed by each plugin instance's basePath.
  export const manifests: Record<string, GraphQLManifest>;

  // Lazy loaders for the full introspection, code-split per basePath.
  export const loaders: Record<
    string,
    () => Promise<{ default: IntrospectionQuery }>
  >;
}
