import { Outlet, useParams } from "react-router";
import { joinPath } from "../../util/joinPath.js";
import type { GraphQLClient } from "./client/GraphQLClient.js";
import { GraphQLProvider } from "./client/GraphQLContext.js";
import { OasConfigProvider } from "./context.js";
import { type OasPluginConfig } from "./interfaces.js";

export const OpenApiRoute = ({
  basePath,
  versions,
  config,
  client,
}: {
  basePath: string;
  versions: string[];
  config: OasPluginConfig;
  client: GraphQLClient;
}) => {
  const { version } = useParams<"version">();

  const input =
    config.type === "file"
      ? {
          type: config.type,
          input: version
            ? config.input[version]!
            : Object.values(config.input).at(0)!,
        }
      : { type: config.type, input: config.input };

  const currentVersion = version ?? versions.at(0);

  return (
    <OasConfigProvider
      value={{
        config: {
          ...config,
          version: currentVersion,
          versions: Object.fromEntries(
            versions.map((version) => [version, joinPath(basePath, version)]),
          ),
          ...input,
        },
      }}
    >
      <GraphQLProvider client={client}>
        <Outlet />
      </GraphQLProvider>
    </OasConfigProvider>
  );
};
