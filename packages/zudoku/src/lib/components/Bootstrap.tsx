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
  i18n,
}: {
  hydrate?: boolean;
  router: ReturnType<typeof createBrowserRouter>;
  i18n: import("i18next").i18n;
}) => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={hydrate ? (window as any).DATA : undefined}>
        <BypassProtectedRoutesContext value={false}>
          <HelmetProvider>
            <I18nextProvider i18n={i18n}>
              <StaggeredRenderContext.Provider value={{ stagger: !hydrate }}>
                <RouterProvider router={router} />
              </StaggeredRenderContext.Provider>
            </I18nextProvider>
          </HelmetProvider>
        </BypassProtectedRoutesContext>
      </HydrationBoundary>
    </QueryClientProvider>
  </StrictMode>
);

const BootstrapStatic = ({
  router,
  context,
  queryClient,
  helmetContext,
  bypassProtection = false,
  i18n,
}: {
  helmetContext: HelmetData["context"];
  context: StaticHandlerContext;
  queryClient: QueryClient;
  router: ReturnType<typeof createStaticRouter>;
  bypassProtection?: boolean;
  i18n: import("i18next").i18n;
}) => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider context={helmetContext}>
        <BypassProtectedRoutesContext value={bypassProtection}>
          <I18nextProvider i18n={i18n}>
            <StaticRouterProvider router={router} context={context} />
          </I18nextProvider>
        </BypassProtectedRoutesContext>
      </HelmetProvider>
    </QueryClientProvider>
  </StrictMode>
);

export { Bootstrap, BootstrapStatic };
