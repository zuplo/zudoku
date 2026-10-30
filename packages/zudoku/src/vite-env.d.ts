/// <reference types="vite/client" />

declare module "vite/modulepreload-polyfill" {}

interface ImportMetaEnv {
  readonly IS_ZUPLO: boolean;
  readonly ZUPLO_BUILD_ID?: string;
  readonly ZUDOKU_HAS_SERVER: boolean;
  readonly ZUPLO_DEV_PORTAL_ZUPLO_BRANDING?: boolean;
}
