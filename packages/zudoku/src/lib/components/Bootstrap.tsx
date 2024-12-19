import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { type HelmetData, HelmetProvider } from "@zudoku/react-helmet-async";
import { StrictMode } from "react";
import {
  type createBrowserRouter,
  type createStaticRouter,
  type StaticHandlerContext,
  StaticRouterProvider,
} from "react-router";
import { RouterProvider } from "react-router/dom";
import { StaggeredRenderContext } from "../plugins/openapi/StaggeredRender.js";

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
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={hydrate ? (window as any).DATA : undefined}>
        <HelmetProvider>
          <StaggeredRenderContext.Provider value={{ stagger: !hydrate }}>
            <RouterProvider router={router} />
          </StaggeredRenderContext.Provider>
        </HelmetProvider>
      </HydrationBoundary>
    </QueryClientProvider>
  </StrictMode>
);

const BootstrapStatic = ({
  router,
  context,
  queryClient,
  helmetContext,
}: {
  helmetContext: HelmetData["context"];
  context: StaticHandlerContext;
  queryClient: QueryClient;
  router: ReturnType<typeof createStaticRouter>;
}) => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider context={helmetContext}>
        <StaticRouterProvider router={router} context={context} />
      </HelmetProvider>
    </QueryClientProvider>
  </StrictMode>
);

export { Bootstrap, BootstrapStatic };
