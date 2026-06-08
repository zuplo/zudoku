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

type GraphQLUrlConfig = {
  type: "url";
  input: string;
  path: string;
  options?: GraphQLPluginOptions;
};

type GraphQLFileConfig = {
  type: "file";
  input: string;
  path: string;
  options?: GraphQLPluginOptions;
};

export type GraphQLConfig = GraphQLUrlConfig | GraphQLFileConfig;

export const GRAPHQL_PLUGIN_NAME = "graphql";
