import type { RouteObject } from "react-router";
import type { HighlighterCore } from "shiki";
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
import "virtual:zudoku-theme.css";
import { Zudoku } from "zudoku/components";
import { Outlet } from "zudoku/router";
import type { ZudokuConfig } from "../config/config.js";
import { BuildCheck } from "../lib/components/BuildCheck.js";
import { Layout } from "../lib/components/Layout.js";
import { Meta } from "../lib/components/Meta.js";
import "./main.css";
import "./polyfills.js";
import { StatusPage } from "../lib/components/StatusPage.js";
import { isNavigationPlugin } from "../lib/core/plugins.js";
import { RouteGuard } from "../lib/core/RouteGuard.js";
import type { ZudokuContextOptions } from "../lib/core/ZudokuContext.js";
import { RouterError } from "../lib/errors/RouterError.js";
import { ZuploEnv } from "./env.js";

export const shikiReady: Promise<HighlighterCore> =
  import("../lib/shiki.js").then(async ({ highlighterPromise }) => {
    const highlighter = await highlighterPromise;
    const { registerShiki } = await import("virtual:zudoku-shiki-register");
    await registerShiki(highlighter);
    return highlighter;
  });

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
      highlighterPromise: shikiReady,
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

  // @TODO Detect conflicts in routes and log warning

  return routes;
};

const processRoutes = (
  routes: RouteObject[],
  // children should inherit layout from parent
  shouldWrap = true,
): RouteObject[] =>
  routes.map((r) => {
    const route = r.children
      ? { ...r, children: processRoutes(r.children, false) }
      : r;

    return shouldWrap && r.handle?.layout !== "none"
      ? { element: <Layout />, children: [route] }
      : route;
  });

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
          children: processRoutes(routes),
        },
      ],
    },
  ];
};
