import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { createHead, type Unhead, UnheadProvider } from "@unhead/react/client";
import { StrictMode } from "react";
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

const head = createHead();

const Bootstrap = ({
  router,
  hydrate = false,
}: {
  hydrate?: boolean;
  router: ReturnType<typeof createBrowserRouter>;
}) => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* biome-ignore lint/suspicious/noExplicitAny: Allow any type */}
      <HydrationBoundary state={hydrate ? (window as any).DATA : undefined}>
        <BypassProtectedRoutesContext value={false}>
          <UnheadProvider head={head}>
            <StaggeredRenderContext.Provider value={{ stagger: !hydrate }}>
              <RouterProvider router={router} />
            </StaggeredRenderContext.Provider>
          </UnheadProvider>
        </BypassProtectedRoutesContext>
      </HydrationBoundary>
    </QueryClientProvider>
  </StrictMode>
);

const BootstrapStatic = ({
  router,
  context,
  queryClient,
  head,
  bypassProtection = false,
}: {
  head: Unhead;
  context: StaticHandlerContext;
  queryClient: QueryClient;
  router: ReturnType<typeof createStaticRouter>;
  bypassProtection?: boolean;
}) => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <UnheadProvider head={head}>
        <BypassProtectedRoutesContext value={bypassProtection}>
          <StaticRouterProvider router={router} context={context} />
        </BypassProtectedRoutesContext>
      </UnheadProvider>
    </QueryClientProvider>
  </StrictMode>
);

export { Bootstrap, BootstrapStatic };
