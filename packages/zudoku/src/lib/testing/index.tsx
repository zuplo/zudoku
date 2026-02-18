import {
  QueryClient,
  QueryClientProvider,
  type QueryKey,
} from "@tanstack/react-query";
import { HelmetProvider } from "@zudoku/react-helmet-async";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import type { AuthenticationPlugin } from "../authentication/authentication.js";
import { useAuthState } from "../authentication/state.js";
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
  isAuthenticated?: boolean;
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

const noopAuth: AuthenticationPlugin = {
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {},
  signRequest: async (req) => req,
};

const StaticZudoku = ({
  path,
  queryData,
  env = {},
  isAuthenticated,
  ...options
}: StaticZudokuProps) => {
  if (isAuthenticated) {
    useAuthState.setState({
      isAuthenticated: true,
      isPending: false,
      profile: {
        sub: "test-user",
        email: "test@example.com",
        emailVerified: true,
        name: "Test User",
        pictureUrl: undefined,
      },
      providerData: null,
    });

    options.plugins = [...(options.plugins ?? []), noopAuth];
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: false,
        // Ensure un-mocked queries fail immediately instead of hanging
        queryFn: () => {
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
