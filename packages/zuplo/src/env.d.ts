// biome-ignore-all lint: ambient type shims for zudoku source Vite globals
interface ImportMeta {
  env: any;
  hot?: any;
}

declare module "*.css" {}

declare module "virtual:zuplo-context" {
  import type { ZuploContext } from "./context/types.js";

  // The inspected Zuplo context, baked in at build time by the companion Vite
  // plugin. `undefined` during config loading, where the module is stubbed.
  export const zuploContext: ZuploContext | undefined;
}

// Ambient shim so the virtual module inside @zudoku/plugin-graphql's source
// resolves when typechecking against the workspace package. Loosely typed to
// stay assignable to the plugin's own internal types.
declare module "virtual:@zudoku/plugin-graphql/schema" {
  export const manifests: Record<string, any>;
  export const loaders: Record<string, () => Promise<{ default: any }>>;
}
