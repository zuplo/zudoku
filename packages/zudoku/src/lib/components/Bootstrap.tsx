import { type HelmetData, HelmetProvider } from "@zudoku/react-helmet-async";
import { StrictMode } from "react";
import { type createBrowserRouter, RouterProvider } from "react-router-dom";
import {
  type createStaticRouter,
  type StaticHandlerContext,
  StaticRouterProvider,
} from "react-router-dom/server.js";
import { StaggeredRenderContext } from "../plugins/openapi/StaggeredRender.js";

const Bootstrap = ({
  router,
  hydrate = false,
}: {
  hydrate?: boolean;
  router: ReturnType<typeof createBrowserRouter>;
}) => {
  return (
    <StrictMode>
      <HelmetProvider>
        <StaggeredRenderContext.Provider value={{ stagger: !hydrate }}>
          <RouterProvider router={router} />
        </StaggeredRenderContext.Provider>
      </HelmetProvider>
    </StrictMode>
  );
};

const BootstrapStatic = ({
  router,
  context,
  helmetContext,
}: {
  helmetContext: HelmetData["context"];
  context: StaticHandlerContext;
  router: ReturnType<typeof createStaticRouter>;
}) => (
  <StrictMode>
    <HelmetProvider context={helmetContext}>
      <StaticRouterProvider router={router} context={context} />
    </HelmetProvider>
  </StrictMode>
);

export { Bootstrap, BootstrapStatic };
