export type ZuploOpenApiFile = {
  /** File name inside the Zuplo project's `config/` directory, e.g. `routes.oas.json` */
  fileName: string;
  /** Input path relative to the docs root dir, e.g. `../config/routes.oas.json` */
  input: string;
};

export type ZuploGraphQLEndpoint = {
  /** Route path on the gateway, e.g. `/graphql` */
  routePath: string;
  /** URL the schema is introspected from and the playground sends operations to */
  url: string;
  /** Route summary, used as the title of the GraphQL reference */
  title?: string;
  /** Route description, shown on the GraphQL overview page */
  description?: string;
};

/**
 * Everything the plugin needs to know about a Zuplo project to build the
 * Zudoku config. Must stay JSON-serializable: it is baked into the client and
 * server bundles through the `virtual:zuplo-context` module.
 */
export type ZuploContext = {
  /** All scanned `*.oas.json` file names in the project's `config/` directory */
  configFiles: string[];
  /** Files with documentable operations, each set up as an OpenAPI reference */
  openApiFiles: ZuploOpenApiFile[];
  graphqlEndpoints: ZuploGraphQLEndpoint[];
};
