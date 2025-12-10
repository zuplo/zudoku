import bs58 from "bs58";

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

export const getZuploSystemConfigurations = (string?: string) => {
  if (!string) return undefined;

  try {
    const zuploSystemConfigurations: ZuploEnvironmentVariables = JSON.parse(
      Buffer.from(bs58.decode(string)).toString("utf8"),
    );

    return zuploSystemConfigurations;
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Logging allowed here
    console.error(error);
    return undefined;
  }
};
