import type { ZudokuConfig } from "../config/validators/ZudokuConfig.js";

/**
 *  @deprecated `withZuplo` is no longer functional. Install `@zuplo/zudoku` and
 *  add `zuploPlugin()` to the `plugins` in your Zudoku config instead. It will
 *  be removed in a future version.
 */
const withZuplo = (config: ZudokuConfig): ZudokuConfig => {
  // biome-ignore lint/suspicious/noConsole: Logging allowed here
  console.warn(
    "`withZuplo` is deprecated and no longer functional. Install `@zuplo/zudoku` and add `zuploPlugin()` to the `plugins` in your Zudoku config instead.",
  );
  return config;
};

export default withZuplo;
