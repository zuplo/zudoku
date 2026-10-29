import { getZuploSystemConfigurations } from "../vite/zuplo.js";

const parseBoolean = (value: string | undefined): boolean | undefined => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

/**
 * Build-time only. Reads Zuplo settings from `process.env`; the client
 * receives only the derived values through Vite `define` (see
 * `vite/config.ts`), so don't import this from app code.
 */
export const ZuploEnv = {
  /**
   * Indicates that the build is running in Zuplo "mode"
   */
  get isZuplo(): boolean {
    return process.env.ZUPLO === "1";
  },

  get serverUrl(): string | undefined {
    return process.env.ZUPLO_SERVER_URL;
  },

  /**
   * The Zuplo deployment name, from `ZUPLO_DEPLOYMENT_NAME`, falling back to
   * the deployment name in `ZUPLO_SYSTEM_CONFIGURATIONS`.
   */
  get deploymentName(): string | undefined {
    return (
      process.env.ZUPLO_DEPLOYMENT_NAME ||
      getZuploSystemConfigurations(process.env.ZUPLO_SYSTEM_CONFIGURATIONS)
        ?.__ZUPLO_DEPLOYMENT_NAME
    );
  },

  /**
   * Whether Zuplo branding is shown in the dev portal, from
   * `ZUPLO_DEV_PORTAL_ZUPLO_BRANDING` (`"true"` or `"false"`). Any other value
   * means it isn't set.
   */
  get devPortalZuploBranding(): boolean | undefined {
    return parseBoolean(process.env.ZUPLO_DEV_PORTAL_ZUPLO_BRANDING);
  },
};
