import { configuredApiKeysPlugin } from "virtual:zudoku-api-keys-plugin";
import {
  configuredApiCatalogPlugins,
  configuredApiPlugins,
} from "virtual:zudoku-api-plugins";
import { configuredAuthProvider } from "virtual:zudoku-auth";
import { configuredCustomPagesPlugin } from "virtual:zudoku-custom-pages-plugin";
import { configuredDocsPlugin } from "virtual:zudoku-docs-plugin";
import {
  configuredNavigation,
  configuredNavigationRules,
} from "virtual:zudoku-navigation";
import { configuredRedirectPlugin } from "virtual:zudoku-redirect-plugin";
import { configuredSearchPlugin } from "virtual:zudoku-search-plugin";
import { registerShiki } from "virtual:zudoku-shiki-register";
import type { RouteObject } from "react-router";
import "virtual:zudoku-theme.css";
import {
  BuildCheck,
  Layout,
  Meta,
  RouteGuard,
  RouterError,
  StatusPage,
} from "zudoku/__internal";
import { Zudoku } from "zudoku/components";
import { Outlet } from "zudoku/router";
import type { ZudokuConfig } from "../config/config.js";
import { isNavigationPlugin } from "../lib/core/plugins.js";
import type { ZudokuContextOptions } from "../lib/core/ZudokuContext.js";
import { highlighter } from "../lib/shiki.js";
import { ZuploEnv } from "./env.js";
import "./main.css";

await registerShiki(highlighter);

export const convertZudokuConfigToOptions = (
  config: ZudokuConfig,
): ZudokuContextOptions => {
  return {
    basePath: config.basePath,
    canonicalUrlOrigin: config.canonicalUrlOrigin,
    protectedRoutes: config.protectedRoutes,
    site: {
      ...config.site,
      showPoweredBy:
        ZuploEnv.buildConfig?.entitlements.devPortalZuploBranding ??
        config.site?.showPoweredBy,
      logo: config.site?.logo,
    },
    slots: config.slots,
    metadata: {
      favicon: "https://cdn.zudoku.dev/logos/favicon.svg",
      title: "%s - Zudoku",
      ...config.metadata,
    },
    navigation: configuredNavigation,
    navigationRules: configuredNavigationRules,
    mdx: config.mdx,
    plugins: [
      ...(configuredAuthProvider ? [configuredAuthProvider] : []),
      ...(configuredDocsPlugin ? [configuredDocsPlugin] : []),
      ...configuredApiPlugins,
      ...(configuredSearchPlugin ? [configuredSearchPlugin] : []),
      ...(configuredRedirectPlugin ? [configuredRedirectPlugin] : []),
      ...(configuredApiKeysPlugin ? [configuredApiKeysPlugin] : []),
      ...(configuredCustomPagesPlugin ? [configuredCustomPagesPlugin] : []),
      ...configuredApiCatalogPlugins,
      ...(config.plugins ?? []),
    ],
    syntaxHighlighting: {
      highlighter,
      themes: config.syntaxHighlighting?.themes,
    },
  };
};

export const getRoutesByOptions = (
  options: ZudokuContextOptions,
  enableStatusPages = true,
) => {
  const allPlugins = [
    ...(options.plugins ?? []),
    ...(options.authentication ? [options.authentication] : []),
  ];

  const pluginRoutes = allPlugins.flatMap((plugin) =>
    isNavigationPlugin(plugin) ? plugin.getRoutes() : [],
  );

  // Check if any plugin provides a catch-all route (e.g. custom 404 page)
  const customCatchAll = pluginRoutes.find((r) => r.path === "*");
  const routesWithoutCatchAll = customCatchAll
    ? pluginRoutes.filter((r) => r !== customCatchAll)
    : pluginRoutes;

  const notFoundRoute = {
    element: customCatchAll?.element ?? <StatusPage statusCode={404} />,
    ...(customCatchAll?.handle ? { handle: customCatchAll.handle } : {}),
  };

  const routes = routesWithoutCatchAll
    .concat(
      enableStatusPages
        ? [400, 500].map((statusCode) => ({
            path: `/${statusCode}`,
            element: <StatusPage statusCode={statusCode} />,
          }))
        : [],
    )
    .concat(
      // Always create the /404 route when status pages are enabled or a custom
      // catch-all exists, so that 404.html is prerendered with the correct content
      enableStatusPages || customCatchAll
        ? [{ path: "/404", ...notFoundRoute }]
        : [],
    )
    .concat([{ path: "*", ...notFoundRoute }])
    .map((route) => ({
      ...route,
      errorElement: <RouterError className="w-full m-0" />,
    }));

  // @TODO Detect conflicts in routes and log warning

  return routes;
};

export const getRoutesByConfig = (config: ZudokuConfig): RouteObject[] => {
  const options = convertZudokuConfigToOptions(config);
  const routes = getRoutesByOptions(
    options,
    import.meta.env.IS_ZUPLO || config.enableStatusPages,
  );

  return [
    {
      element: (
        <Zudoku {...options} env={import.meta.env}>
          <BuildCheck
            buildId={import.meta.env.ZUPLO_BUILD_ID}
            environmentType={import.meta.env.ZUPLO_ENVIRONMENT_TYPE}
          />
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
  ];
};

const wrapWithLayout = (route: RouteObject) => {
  return {
    element: <Layout />,
    children: [route],
  };
};
