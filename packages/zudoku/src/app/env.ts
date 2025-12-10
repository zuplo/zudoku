import bs58 from "bs58";
import { z } from "zod";
import { BuildConfigSchema } from "./ZuploBuildConfig.js";

export type ZuploEnvironmentVariables = {
  __ZUPLO_DEPLOYMENT_NAME?: string;
  __ZUPLO_LOGGING_ID?: string;
  __ZUPLO_REMOTE_LOG_TOKEN?: string;
  __ZUPLO_AUTH_API_JWT?: string;
  __ZUPLO_EXTERNAL_SERVICE_TOKEN?: string;
  ZUPLO_ENVIRONMENT_TYPE?: "PRODUCTION" | "DEVELOPMENT" | "STAGING";
  ZUPLO_PROJECT_ID?: string;
  ZUPLO_API_KEY_SERVICE_BUCKET_NAME?: string;
  ZUPLO_SERVICE_BUCKET_ID?: string;
  __ZUPLO_CONFIG?: string;
};

const getZuploSystemConfigurations = () => {
  if (!process.env.ZUPLO_SYSTEM_CONFIGURATIONS) return undefined;

  try {
    const zuploSystemConfigurations: ZuploEnvironmentVariables = JSON.parse(
      Buffer.from(
        bs58.decode(process.env.ZUPLO_SYSTEM_CONFIGURATIONS),
      ).toString("utf8"),
    );

    return zuploSystemConfigurations;
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.error(error);
    return undefined;
  }
};

const getZuploBuildConfig = () => {
  if (!process.env.ZUPLO_BUILD_CONFIG) return undefined;

  try {
    const zuploBuildConfig = BuildConfigSchema.parse(
      JSON.parse(process.env.ZUPLO_BUILD_CONFIG),
    );
    return zuploBuildConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // biome-ignore lint/suspicious/noConsole: Logging allowed here
      console.error("ZUPLO_BUILD_CONFIG is invalid.");
      // biome-ignore lint/suspicious/noConsole: Logging allowed here
      console.log(error.issues);
      return undefined;
    }
    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.error(
      "ZUPLO_BUILD_CONFIG is a reserved environment variable and cannot be used for custom configuration. Please remove it from your environment variables.",
    );
    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.log(error);
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
  systemConfigurations: getZuploSystemConfigurations(),
};
