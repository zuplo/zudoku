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
        <HelmetProvider>
          <RouterProvider router={router} />
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
  bypassProtection = false,
  renderContext,
}: {
  helmetContext: HelmetData["context"];
  context: StaticHandlerContext;
  queryClient: QueryClient;
  router: ReturnType<typeof createStaticRouter>;
  bypassProtection?: boolean;
  renderContext?: RenderContextValue;
}) => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider context={helmetContext}>
        <RenderContext
          value={
            renderContext ?? { status: 200, bypassProtection: bypassProtection }
          }
        >
          <StaticRouterProvider router={router} context={context} />
        </RenderContext>
      </HelmetProvider>
    </QueryClientProvider>
  </StrictMode>
);

export { Bootstrap, BootstrapStatic };
