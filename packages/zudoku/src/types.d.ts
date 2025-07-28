declare module "virtual:zudoku-docs-plugin" {
  export const configuredDocsPlugin:
    | import("./lib/core/plugins.ts").ZudokuPlugin
    | undefined;
  /**
   * Map of markdown files and imports
   */
  export const configuredMarkdownFiles: Record<string, () => Promise<unknown>>;
}

declare module "virtual:zudoku-navigation" {
  export const configuredNavigation: import("./config/validators/NavigationSchema.ts").NavigationConfig;
}

declare module "virtual:zudoku-api-plugins" {
  export const configuredApiPlugins: import("./lib/core/plugins.ts").ZudokuPlugin[];
  export const configuredApiCatalogPlugins: import("./lib/core/plugins.ts").ZudokuPlugin[];
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
    | import("./lib/authentication/authentication.ts").AuthenticationPlugin
    | undefined;
}

declare module "virtual:zudoku-shiki-register" {
  import type { HighlighterCore } from "shiki/core";
  export const registerShiki: (highlighter: HighlighterCore) => Promise<void>;
}
