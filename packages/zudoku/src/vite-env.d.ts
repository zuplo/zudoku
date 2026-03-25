/// <reference types="vite/client" />

declare module "vite/modulepreload-polyfill" {}

interface ImportMetaEnv {
  readonly IS_ZUPLO: boolean;
  readonly ZUPLO_BUILD_ID?: string;
}
