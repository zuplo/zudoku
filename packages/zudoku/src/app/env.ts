import { z } from "zod/mini";
import { parseBuildConfig } from "./ZuploBuildConfig.js";

const formatError = (error: unknown) => {
  if (error instanceof SyntaxError) {
    return "ZUPLO_BUILD_CONFIG contains invalid JSON";
  }
  if (error instanceof z.core.$ZodError) {
    return `ZUPLO_BUILD_CONFIG is invalid:\n${z.prettifyError(error)}`;
  }
  return `ZUPLO_BUILD_CONFIG is invalid: ${error}`;
};

const getZuploBuildConfig = () => {
  if (!process.env.ZUPLO_BUILD_CONFIG) return undefined;

  try {
    const parsed = JSON.parse(process.env.ZUPLO_BUILD_CONFIG);
    return parseBuildConfig(parsed);
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.error(formatError(error));
    return undefined;
  }
};

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

  buildConfig: getZuploBuildConfig(),
};
