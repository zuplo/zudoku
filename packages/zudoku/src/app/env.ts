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

// Memoized on the raw env value (not once at first access) so values loaded
// after module init (e.g. dotenv) are still picked up.
let cached: {
  raw: string;
  value: ReturnType<typeof parseBuildConfig> | undefined;
};

const parseRawBuildConfig = (raw: string) => {
  try {
    return parseBuildConfig(JSON.parse(raw));
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

  get buildConfig() {
    const raw = process.env.ZUPLO_BUILD_CONFIG;
    if (!raw) return undefined;
    if (cached?.raw !== raw) {
      cached = { raw, value: parseRawBuildConfig(raw) };
    }

    return cached.value;
  },
};
