import { useMemo } from "react";
import { Outlet } from "react-router";
import { joinPath } from "../../util/joinPath.js";
import type { GraphQLClient } from "./client/GraphQLClient.js";
import { GraphQLProvider } from "./client/GraphQLContext.js";
import { OasConfigProvider } from "./context.js";
import { type OasPluginConfig } from "./interfaces.js";
import { getVersions } from "./util/getRoutes.js";

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
    const versions = getVersions(config);
    const firstVersion = Object.values(config.input).at(0);
    const input =
      config.type === "file"
        ? {
            type: config.type,
            input: version ? config.input[version]! : firstVersion!,
          }
        : { type: config.type, input: config.input };

    return {
      config: {
        ...config,
        version: version ?? versions.at(0),
        versions: Object.fromEntries(
          versions.map((version) => [version, joinPath(basePath, version)]),
        ),
        ...input,
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
