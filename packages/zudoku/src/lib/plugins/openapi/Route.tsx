import { Outlet } from "react-router-dom";
import { Provider, Client as UrqlClient } from "urql";
import { OasConfigProvider } from "./context.js";
import { OasPluginConfig } from "./interfaces.js";

export function OpenApiRoute({
  config,
  client,
}: {
  config: OasPluginConfig;
  client: typeof UrqlClient;
}) {
  return (
    <Provider value={client}>
      <OasConfigProvider value={{ config }}>
        <Outlet />
      </OasConfigProvider>
    </Provider>
  );
}
