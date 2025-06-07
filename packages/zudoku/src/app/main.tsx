import { type RouteObject } from "react-router";
import { configuredApiKeysPlugin } from "virtual:zudoku-api-keys-plugin";
import {
  configuredApiCatalogPlugins,
  configuredApiPlugins,
} from "virtual:zudoku-api-plugins";
import { configuredAuthProvider } from "virtual:zudoku-auth";
import { configuredCustomPagesPlugin } from "virtual:zudoku-custom-pages-plugin";
import { configuredDocsPlugins } from "virtual:zudoku-docs-plugins";
import { configuredNavigation } from "virtual:zudoku-navigation";
import { configuredRedirectPlugin } from "virtual:zudoku-redirect-plugin";
import { configuredSearchPlugin } from "virtual:zudoku-search-plugin";
import { registerShiki } from "virtual:zudoku-shiki-register";
import "virtual:zudoku-theme.css";
import {
  BuildCheck,
  Layout,
  RouteGuard,
  RouterError,
  StatusPage,
  Zudoku,
} from "zudoku/components";
import type { ZudokuConfig } from "../config/config.js";
import type { ZudokuContextOptions } from "../lib/core/ZudokuContext.js";
import { isNavigationPlugin } from "../lib/core/plugins.js";
import { highlighter } from "../lib/shiki.js";
import { ZuploEnv } from "./env.js";

await registerShiki(highlighter);

export const convertZudokuConfigToOptions = (
  config: ZudokuConfig,
): ZudokuContextOptions => {
  return {
    basePath: config.basePath,
    canonicalUrlOrigin: config.canonicalUrlOrigin,
    protectedRoutes: config.protectedRoutes,
    page: {
      ...config.page,
      showPoweredBy:
        ZuploEnv.buildConfig?.entitlements.devPortalZuploBranding ??
        config.page?.showPoweredBy,
      logo: config.page?.logo,
    },
    slots: config.slots,
    metadata: {
      favicon: "https://cdn.zudoku.dev/logos/favicon.svg",
      title: "%s - Zudoku",
      ...config.metadata,
    },
    navigation: configuredNavigation,
    mdx: config.mdx,
    plugins: [
      ...(configuredAuthProvider ? [configuredAuthProvider] : []),
      ...configuredDocsPlugins,
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

  const routes = allPlugins
    .flatMap((plugin) => (isNavigationPlugin(plugin) ? plugin.getRoutes() : []))
    .concat(
      enableStatusPages
        ? [400, 403, 404, 405, 414, 416, 500, 501, 502, 503, 504].map(
            (statusCode) => ({
              path: `/${statusCode}`,
              element: <StatusPage statusCode={statusCode} />,
            }),
          )
        : [],
    )
    .concat([
      {
        path: "*",
        loader: () => {
          throw new Response("Not Found", { status: 404 });
        },
      },
    ]);

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
        <Zudoku {...options}>
          <BuildCheck
            buildId={
              import.meta.env.IS_ZUPLO && import.meta.env.ZUPLO_BUILD_ID
                ? import.meta.env.ZUPLO_BUILD_ID
                : undefined
            }
          />
          <Layout />
        </Zudoku>
      ),
      children: [
        {
          element: <RouteGuard />,
          errorElement: <RouterError />,
          children: routes,
        },
      ],
    },
  ];
};
