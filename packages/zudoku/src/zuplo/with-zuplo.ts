import type { CommonConfig } from "../config/validators/common.js";

/**
 *  @deprecated `withZuplo` is no longer needed and will automatically be applied. It will be removed in a future version.
 */
const withZuplo = <TConfig extends CommonConfig>(config: TConfig): TConfig => {
  // eslint-disable-next-line no-console
  console.warn(
    "`withZuplo` is no longer needed and will automatically be applied. It will be removed in a future version.",
  );
  return config;
};

export default withZuplo;
