import { Outlet } from "react-router-dom";
import { GraphQLProvider } from "./client/GraphQLContext.js";
import { OasConfigProvider } from "./context.js";
import { OasPluginConfig } from "./interfaces.js";

export const OpenApiRoute = ({ config }: { config: OasPluginConfig }) => (
  <OasConfigProvider value={{ config }}>
    <GraphQLProvider>
      <Outlet />
    </GraphQLProvider>
  </OasConfigProvider>
);
