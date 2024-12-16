import { CommonConfig, ZudokuApiConfig } from "../config/validators/common.js";
import { removeExtensions } from "../lib/plugins/openapi/post-processors/removeExtensions.js";
import { removePaths } from "../lib/plugins/openapi/post-processors/removePaths.js";

function withZuplo<TConfig extends CommonConfig>(config: TConfig): TConfig {
  if (config.apis) {
    if (Array.isArray(config.apis)) {
      config.apis = config.apis.map(configureApis);
    } else {
      config.apis = configureApis(config.apis);
    }
  }

  return config;
}

function configureApis(config: ZudokuApiConfig): ZudokuApiConfig {
  if (config.type === "file") {
    config.postProcessors = [
      removeExtensions({ keys: ["x-zuplo-route", "x-zuplo-path"] }),
      removePaths({
        // custom filter (method is `true` for all methods)
        shouldRemove: ({ operation }) => operation["x-internal"],
      }),
      ...(config.postProcessors ?? []),
    ];
  }

  return config;
}

export default withZuplo;
