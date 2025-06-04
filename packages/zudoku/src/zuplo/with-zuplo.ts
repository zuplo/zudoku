import type { ZudokuConfig } from "../config/validators/validate.js";

/**
 *  @deprecated `withZuplo` is no longer needed and will automatically be applied. It will be removed in a future version.
 */
const withZuplo = (config: ZudokuConfig): ZudokuConfig => {
  // eslint-disable-next-line no-console
  console.warn(
    "`withZuplo` is no longer needed and will automatically be applied. It will be removed in a future version.",
  );
  return config;
};

export default withZuplo;
