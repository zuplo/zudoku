import {
  QueryClient,
  QueryClientProvider,
  type QueryKey,
} from "@tanstack/react-query";
import { HelmetProvider } from "@zudoku/react-helmet-async";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { RenderContext } from "../components/context/RenderContext.js";
import { Layout } from "../components/Layout.js";
import { Meta } from "../components/Meta.js";
import { Zudoku } from "../components/Zudoku.js";
import { isNavigationPlugin, type RouteObject } from "../core/plugins.js";
import { RouteGuard } from "../core/RouteGuard.js";
import type { ZudokuContextOptions } from "../core/ZudokuContext.js";
import { RouterError } from "../errors/RouterError.js";

type QueryData = {
  queryKey: QueryKey;
  data: unknown;
};

type StaticZudokuProps = ZudokuContextOptions & {
  path: string;
  queryData?: QueryData[];
  env?: Record<string, string>;
};

const getRoutesByOptions = (options: ZudokuContextOptions) => {
  return [
    ...(options.plugins ?? []),
    ...(options.authentication ? [options.authentication] : []),
  ].flatMap((plugin) => (isNavigationPlugin(plugin) ? plugin.getRoutes() : []));
};

const wrapWithLayout = (route: RouteObject) => ({
  element: <Layout />,
  children: [route],
});

const StaticZudoku = ({
  path,
  queryData,
  env = {},
  ...options
}: StaticZudokuProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: false,
        // Ensure un-mocked queries fail immediately instead of hanging
        queryFn: (q) => {
          throw new Error("No queryData provided for this query key");
        },
      },
    },
  });

  queryClient.setQueryData(["zudoku-initialize", "no-dehydrate"], true);

  for (const { queryKey, data } of queryData ?? []) {
    queryClient.setQueryData(queryKey, data);
  }

  const routes = getRoutesByOptions(options);
  const router = createMemoryRouter(
    [
      {
        element: (
          <Zudoku {...options} env={env}>
            <Outlet />
          </Zudoku>
        ),
        hydrateFallbackElement: <div>Loading...</div>,
        children: [
          {
            element: (
              <Meta>
                <RouteGuard />
              </Meta>
            ),
            errorElement: <RouterError />,
            children: routes.map((r) =>
              r.handle?.layout === "none" ? r : wrapWithLayout(r),
            ),
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <RenderContext value={{ status: 200, bypassProtection: false }}>
          <RouterProvider router={router} />
        </RenderContext>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export { StaticZudoku, type StaticZudokuProps, type QueryData };
