import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { type HelmetData, HelmetProvider } from "@zudoku/react-helmet-async";
import { StrictMode } from "react";
import { I18nextProvider } from "react-i18next";
import {
  type createBrowserRouter,
  type createStaticRouter,
  type StaticHandlerContext,
  StaticRouterProvider,
} from "react-router";
import { RouterProvider } from "react-router/dom";
import i18n from "../i18n.js";
import { StaggeredRenderContext } from "../plugins/openapi/StaggeredRender.js";
import { BypassProtectedRoutesContext } from "./context/BypassProtectedRoutesContext.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
});

const Bootstrap = ({
  router,
  hydrate = false,
}: {
  hydrate?: boolean;
  router: ReturnType<typeof createBrowserRouter>;
}) => (
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={hydrate ? (window as any).DATA : undefined}>
          <BypassProtectedRoutesContext value={false}>
            <HelmetProvider>
              <StaggeredRenderContext.Provider value={{ stagger: !hydrate }}>
                <RouterProvider router={router} />
              </StaggeredRenderContext.Provider>
            </HelmetProvider>
          </BypassProtectedRoutesContext>
        </HydrationBoundary>
      </QueryClientProvider>
    </I18nextProvider>
  </StrictMode>
);

const BootstrapStatic = ({
  router,
  context,
  queryClient,
  helmetContext,
  bypassProtection = false,
}: {
  helmetContext: HelmetData["context"];
  context: StaticHandlerContext;
  queryClient: QueryClient;
  router: ReturnType<typeof createStaticRouter>;
  bypassProtection?: boolean;
}) => (
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider context={helmetContext}>
          <BypassProtectedRoutesContext value={bypassProtection}>
            <StaticRouterProvider router={router} context={context} />
          </BypassProtectedRoutesContext>
        </HelmetProvider>
      </QueryClientProvider>
    </I18nextProvider>
  </StrictMode>
);

export { Bootstrap, BootstrapStatic };
