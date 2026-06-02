import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { type Unhead, UnheadProvider } from "@unhead/react/client";
import { UnheadProvider as UnheadServerProvider } from "@unhead/react/server";
import { StrictMode } from "react";
import {
  type createBrowserRouter,
  type createStaticRouter,
  type StaticHandlerContext,
  StaticRouterProvider,
} from "react-router";
import { RouterProvider } from "react-router/dom";
import {
  RenderContext,
  type RenderContextValue,
} from "./context/RenderContext.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
});

export const BootstrapClient = ({
  router,
  head,
  hydrate = false,
}: {
  hydrate?: boolean;
  head: Unhead;
  router: ReturnType<typeof createBrowserRouter>;
}) => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={hydrate ? window.ZUDOKU_DATA : undefined}>
        <UnheadProvider head={head}>
          <RenderContext value={{ status: 200, bypassProtection: false }}>
            <RouterProvider router={router} />
          </RenderContext>
        </UnheadProvider>
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
  renderContext,
}: {
  head: Unhead;
  context: StaticHandlerContext;
  queryClient: QueryClient;
  router: ReturnType<typeof createStaticRouter>;
  bypassProtection?: boolean;
  renderContext?: RenderContextValue;
}) => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={undefined}>
        <UnheadServerProvider value={head}>
          <RenderContext
            value={
              renderContext ?? {
                status: 200,
                bypassProtection: bypassProtection,
              }
            }
          >
            <StaticRouterProvider router={router} context={context} />
          </RenderContext>
        </UnheadServerProvider>
      </HydrationBoundary>
    </QueryClientProvider>
  </StrictMode>
);

export { BootstrapStatic };
