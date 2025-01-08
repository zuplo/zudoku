import { Outlet } from "react-router";
import type { GraphQLClient } from "./client/GraphQLClient.js";
import { GraphQLProvider } from "./client/GraphQLContext.js";
import { OasConfigProvider } from "./context.js";
import { OasPluginContext } from "./interfaces.js";

export const OpenApiRoute = ({
  config,
  client,
}: {
  config: OasPluginContext;
  client: GraphQLClient;
}) => (
  <OasConfigProvider value={{ config }}>
    <GraphQLProvider client={client}>
      <Outlet />
    </GraphQLProvider>
  </OasConfigProvider>
);
