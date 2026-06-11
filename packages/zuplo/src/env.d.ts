// biome-ignore-all lint: ambient type shim for zudoku source Vite globals
interface ImportMeta {
  env: any;
  hot?: any;
}

declare module "*.css" {}

declare module "virtual:@zudoku/plugin-graphql/schema" {
  export const manifests: Record<string, any>;
  export const loaders: Record<string, () => Promise<{ default: any }>>;
}
