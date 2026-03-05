import { useMemo } from "react";
import { Outlet } from "react-router";
import { joinUrl } from "../../util/joinUrl.js";
import type { GraphQLClient } from "./client/GraphQLClient.js";
import { GraphQLProvider } from "./client/GraphQLContext.js";
import { OasConfigProvider } from "./context.js";
import type { OasPluginConfig } from "./interfaces.js";
import { getVersionMetadata } from "./util/getRoutes.js";

export const OasProvider = ({
  basePath,
  version,
  config,
  client,
}: {
  basePath: string;
  version?: string;
  config: OasPluginConfig;
  client: GraphQLClient;
}) => {
  const value = useMemo(() => {
    const {
      versions: availableVersions,
      labels,
      downloadUrls,
    } = getVersionMetadata(config);
    const currentVersion = version ?? availableVersions.at(0);

    const versionLinks = Object.fromEntries(
      availableVersions.map((id) => [
        id,
        {
          path: joinUrl(basePath, id),
          label: labels[id] ?? id,
          downloadUrl: downloadUrls[id],
        },
      ]),
    );

    const resolveInput = (): string | (() => Promise<unknown>) => {
      if (!Array.isArray(config.input)) {
        return config.input;
      }

      const versionConfig = currentVersion
        ? config.input.find((v) => v.path === currentVersion)
        : config.input[0];

      if (!versionConfig) {
        throw new Error(`No input found for version: ${currentVersion}`);
      }

      return versionConfig.input;
    };

    return {
      config: {
        ...config,
        version: currentVersion,
        versions: versionLinks,
        input: resolveInput(),
      },
    };
  }, [config, basePath, version]);

  return (
    <OasConfigProvider value={value}>
      <GraphQLProvider client={client}>
        <Outlet />
      </GraphQLProvider>
    </OasConfigProvider>
  );
};
