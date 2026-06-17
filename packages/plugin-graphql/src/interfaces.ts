import { joinUrl } from "zudoku";

export type GraphQLPluginOptions = {
  title?: string;
  description?: string;
  showDeprecated?: boolean;
  endpoint?: string;
  playground?: {
    enabled?: boolean;
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

export const resolveEndpointUrl = (
  endpoint: string | undefined,
  baseUrl: string | undefined,
): string | undefined => {
  if (!endpoint) return undefined;
  if (isSchemaUrl(endpoint)) return endpoint;

  return baseUrl ? joinUrl(baseUrl, endpoint) : endpoint;
};
