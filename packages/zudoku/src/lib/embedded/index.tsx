import type { RouteObject } from "react-router";
import type { ZudokuConfig } from "../../config/config.js";
import type { ZudokuContextOptions } from "../core/ZudokuContext.js";
import type { HeaderNavigation } from "../../config/validators/HeaderNavigationSchema.js";
import type {
  Navigation,
  ResolvedNavigationRule,
} from "../../config/validators/NavigationSchema.js";
import { isNavigationPlugin } from "../core/plugins.js";
import { StatusPage } from "../components/StatusPage.js";
import { RouterError } from "../errors/RouterError.js";
import { Zudoku } from "../components/Zudoku.js";
import { Outlet } from "react-router";
import { Meta } from "../components/Meta.js";
import { RouteGuard } from "../core/RouteGuard.js";
import { processRoutes } from "../../app/processRoutes.js";
import { createRedirectRoutes } from "../../app/utils/createRedirectRoutes.js";

/**
 * Convert a ZudokuConfig to ZudokuContextOptions for embedded use.
 * This is a simplified version that doesn't depend on virtual modules.
 *
 * Note: For embedded use, navigation and navigationRules are cast to their resolved types.
 * This is safe because the types are compatible at runtime, though some type-level guarantees
 * are relaxed (e.g., string shorthands for docs are not resolved).
 */
export const convertConfigToOptions = (
  config: ZudokuConfig,
): ZudokuContextOptions => {
  return {
    basePath: config.basePath,
    canonicalUrlOrigin: config.canonicalUrlOrigin,
    aiAssistants: config.aiAssistants,
    protectedRoutes: config.protectedRoutes,
    site: {
      ...config.site,
    },
    slots: config.slots,
    metadata: {
      favicon: "https://cdn.zudoku.dev/logos/favicon.svg",
      title: "%s - Zudoku",
      ...config.metadata,
    },
    header: config.header
      ? {
          navigation: config.header.navigation as HeaderNavigation,
          placements: config.header.placements,
        }
      : undefined,
    // Cast to resolved types for embedded use - this is safe because
    // the types are compatible at runtime for typical usage
    navigation: config.navigation as Navigation,
    navigationRules: config.navigationRules as ResolvedNavigationRule[],
    mdx: config.mdx,
    plugins: [...(config.plugins ?? [])],
  };
};

/**
 * Get routes from ZudokuContextOptions
 */
export const getRoutesByOptions = (
  options: ZudokuContextOptions,
  enableStatusPages = false,
): RouteObject[] => {
  const allPlugins = [
    ...(options.plugins ?? []),
    ...(options.authentication ? [options.authentication] : []),
  ];

  const routes = allPlugins
    .flatMap((plugin) => (isNavigationPlugin(plugin) ? plugin.getRoutes() : []))
    .concat(
      enableStatusPages
        ? [400, 404, 500].map((statusCode) => ({
            path: `/${statusCode}`,
            element: <StatusPage statusCode={statusCode} />,
          }))
        : [],
    )
    .concat([{ path: "*", element: <StatusPage statusCode={404} /> }])
    .map((route) => ({
      ...route,
      errorElement: <RouterError className="w-full m-0" />,
    }));

  return routes;
};

/**
 * Get complete route configuration from a ZudokuConfig for embedded use.
 * This function doesn't depend on virtual modules and can be used in any React application.
 */
export const getRoutesFromConfig = (
  config: ZudokuConfig,
  enableStatusPages = false,
): RouteObject[] => {
  const options = convertConfigToOptions(config);
  const routes = getRoutesByOptions(options, enableStatusPages);

  return [
    ...createRedirectRoutes(config.redirects),
    {
      element: (
        <Zudoku {...options} env={{}}>
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
          children: processRoutes(routes),
        },
      ],
    },
  ];
};
