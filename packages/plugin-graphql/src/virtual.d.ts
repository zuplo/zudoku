declare module "virtual:@zudoku/plugin-graphql/schema" {
  import type { IntrospectionQuery } from "graphql";

  // Introspected schemas keyed by each plugin instance's basePath.
  const schemas: Record<string, IntrospectionQuery>;
  export default schemas;
}
