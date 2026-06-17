export type GraphQLPluginOptions = {
  title?: string;
  description?: string;
  showDeprecated?: boolean;
  playground?: {
    enabled?: boolean;
    endpoint?: string;
    headers?: Record<string, string>;
  };
};

export type GraphQLConfig = {
  /** A URL to a GraphQL endpoint or a path to a GraphQL SDL file. */
  schema: string;
  path: string;
  options?: GraphQLPluginOptions;
};

export const GRAPHQL_PLUGIN_NAME = "graphql";

/** Treat the schema as a remote endpoint when it's an http(s) URL. */
export const isSchemaUrl = (schema: string): boolean =>
  /^https?:\/\//i.test(schema);
