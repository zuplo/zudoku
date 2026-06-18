import { joinUrl } from "zudoku";

export type GraphQLPluginOptions = {
  title?: string;
  description?: string;
  showDeprecated?: boolean;
  playground?: {
    enabled?: boolean;
    headers?: Record<string, string>;
  };
};

export type GraphQLConfig = {
  /** A URL to a GraphQL endpoint or a path to a GraphQL SDL file. */
  schema?: string;
  path: string;
  /**
   * GraphQL endpoint the playground sends operations to. An absolute URL is
   * used as-is; a relative path is resolved against the Zuplo gateway URL when
   * available. Defaults to `${gatewayUrl}/graphql` for Zuplo projects.
   */
  endpoint?: string;
  options?: GraphQLPluginOptions;
};

export const GRAPHQL_PLUGIN_NAME = "graphql";

/** Treat the schema as a remote endpoint when it's an http(s) URL. */
export const isSchemaUrl = (schema: string): boolean =>
  /^https?:\/\//i.test(schema);

/**
 * Resolve where to load the schema from: the configured `schema`, falling back
 * to the `endpoint` when it's a URL we can introspect.
 */
export const resolveSchemaSource = (
  config: GraphQLConfig,
): string | undefined =>
  config.schema ??
  (config.endpoint && isSchemaUrl(config.endpoint)
    ? config.endpoint
    : undefined);

export const resolveEndpointUrl = (
  endpoint: string | undefined,
  baseUrl: string | undefined,
): string | undefined => {
  if (!endpoint) return undefined;
  if (isSchemaUrl(endpoint)) return endpoint;

  return baseUrl ? joinUrl(baseUrl, endpoint) : joinUrl(endpoint);
};
