export type ZuploPluginOptions = {
  /**
   * Set to `false` to disable setting up an OpenAPI reference for each
   * OpenAPI file found in the Zuplo project's `config/` directory.
   * @default true
   */
  openApi?: boolean;
  /**
   * Set to `false` to disable setting up a GraphQL reference for each
   * GraphQL endpoint found in the Zuplo project's routes.
   * @default true
   */
  graphql?: boolean;
};
