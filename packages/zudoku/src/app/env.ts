import { BuildConfigSchema } from "./ZuploBuildConfig.js";

const getZuploBuildConfig = () => {
  if (!process.env.ZUPLO_BUILD_CONFIG) return undefined;

  try {
    const zuploBuildConfig = BuildConfigSchema.parse(
      JSON.parse(process.env.ZUPLO_BUILD_CONFIG),
    );
    return zuploBuildConfig;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "ZUPLO_BUILD_CONFIG is a reserved environment variable and cannot be used for custom configuration. Please remove it from your environment variables.",
    );
    // eslint-disable-next-line no-console
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
};
