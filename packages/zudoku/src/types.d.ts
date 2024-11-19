declare module "virtual:zudoku-docs-plugins" {
  export const configuredDocsPlugins: import("./lib/core/plugins.ts").ZudokuPlugin[];
  /**
   * Map of markdown files and imports
   */
  export const configuredMarkdownFiles: Record<string, () => Promise<unknown>>;
}

declare module "virtual:zudoku-sidebar" {
  export const configuredSidebar: import("./config/validators/SidebarSchema.ts").SidebarConfig;
}

declare module "virtual:zudoku-api-plugins" {
  export const configuredApiPlugins: import("./lib/core/plugins.ts").ZudokuPlugin[];
}

declare module "virtual:zudoku-search-plugin" {
  export const configuredSearchPlugin:
    | import("./lib/core/plugins.ts").ZudokuPlugin
    | undefined;
}

declare module "virtual:zudoku-api-keys-plugin" {
  export const configuredApiKeysPlugin:
    | import("./lib/core/plugins.ts").ZudokuPlugin
    | undefined;
}

declare module "virtual:zudoku-custom-pages-plugin" {
  export const configuredCustomPagesPlugin:
    | import("./lib/core/plugins.ts").ZudokuPlugin
    | undefined;
}

declare module "virtual:zudoku-redirect-plugin" {
  export const configuredRedirectPlugin:
    | import("./lib/core/plugins.ts").ZudokuPlugin
    | undefined;
}
declare module "virtual:zudoku-config" {
  const config: import("./config/config.ts").ZudokuConfig;
  export default config;
}
declare module "virtual:zudoku-auth" {
  export const configuredAuthProvider:
    | import("./lib/authentication/authentication.ts").AuthenticationProvider
    | undefined;
}
declare module "virtual:zudoku-openapi-worker" {
  export const createClient: () => import("urql").Client;
}
