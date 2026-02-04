import { useMemo } from "react";
import { Outlet } from "react-router";
import type { GraphQLClient } from "./client/GraphQLClient.js";
import { GraphQLProvider } from "./client/GraphQLContext.js";
import { AsyncApiConfigProvider } from "./context.js";
import type { AsyncApiPluginConfig } from "./interfaces.js";

export type AsyncApiPluginOptions = AsyncApiPluginConfig & {
  version?: string;
  versions?: Record<string, { path: string; label: string }>;
  options?: {
    expandApiInformation?: boolean;
    enableSimulator?: boolean;
  };
};

export const AsyncApiProvider = ({
  basePath: _basePath,
  version,
  config,
  client,
}: {
  basePath: string;
  version?: string;
  config: AsyncApiPluginConfig;
  client: GraphQLClient;
}) => {
  const value = useMemo(() => {
    const resolveInput = (): string | (() => Promise<unknown>) => {
      if (!Array.isArray(config.input)) {
        return config.input;
      }

      // Handle versioned inputs
      const versionConfig = version
        ? config.input.find((v) => v.path === version)
        : config.input[0];

      if (!versionConfig) {
        throw new Error(`No input found for version: ${version}`);
      }

      return versionConfig.input;
    };

    // Build versions record from array input
    const versions: Record<
      string,
      { path: string; label: string; downloadUrl?: string }
    > = {};
    if (Array.isArray(config.input)) {
      for (const v of config.input) {
        versions[v.path] = {
          path: v.path,
          label: v.label ?? v.version ?? v.path,
          downloadUrl: v.downloadUrl,
        };
      }
    }

    return {
      config: {
        ...config,
        version,
        versions,
        input: resolveInput(),
        options: config.options,
      },
    };
  }, [config, version]);

  return (
    <AsyncApiConfigProvider value={value}>
      <GraphQLProvider client={client}>
        <Outlet />
      </GraphQLProvider>
    </AsyncApiConfigProvider>
  );
};
