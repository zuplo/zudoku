import { Outlet } from "react-router-dom";
import { OasConfigProvider } from "./context.js";
import { OasPluginConfig } from "./interfaces.js";

import { Provider, Client as UrqlClient } from "./util/urql.js";

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
