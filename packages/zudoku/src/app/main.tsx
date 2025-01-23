import { type RouteObject } from "react-router";
import { configuredApiKeysPlugin } from "virtual:zudoku-api-keys-plugin";
import {
  configuredApiCatalogPlugins,
  configuredApiPlugins,
} from "virtual:zudoku-api-plugins";
import { configuredAuthProvider } from "virtual:zudoku-auth";
import { configuredCustomPagesPlugin } from "virtual:zudoku-custom-pages-plugin";
import { configuredDocsPlugins } from "virtual:zudoku-docs-plugins";
import { configuredRedirectPlugin } from "virtual:zudoku-redirect-plugin";
import { configuredSearchPlugin } from "virtual:zudoku-search-plugin";
import { configuredSidebar } from "virtual:zudoku-sidebar";
import "virtual:zudoku-theme.css";
import { Layout, RouterError, Zudoku } from "zudoku/components";
import type { ZudokuConfig } from "../config/config.js";
import { StatusPage } from "../lib/components/StatusPage.js";
import type { ZudokuContextOptions } from "../lib/core/ZudokuContext.js";
import { isNavigationPlugin } from "../lib/core/plugins.js";

export const convertZudokuConfigToOptions = (
  config: ZudokuConfig,
): ZudokuContextOptions => {
  const fallbackLogoLight =
    config.page?.logoUrl ??
    "https://cdn.zudoku.dev/logos/zudoku-logo-full-light.svg";
  const fallbackLogoDark =
    config.page?.logoUrl ??
    "https://cdn.zudoku.dev/logos/zudoku-logo-full-dark.svg";

  const isUsingFallback =
    !config.page?.logoUrl &&
    !config.page?.logo?.src?.light &&
    !config.page?.logo?.src?.dark;

  return {
    page: {
      ...config.page,
      logo: {
        ...(isUsingFallback ? { width: "130px" } : {}),
        ...config.page?.logo,
        src: {
          light: config.page?.logo?.src?.light ?? fallbackLogoLight,
          dark: config.page?.logo?.src?.dark ?? fallbackLogoDark,
        },
      },
    },
    slotlets: config.UNSAFE_slotlets,
    metadata: {
      favicon: "https://cdn.zudoku.dev/logos/favicon.svg",
      title: "%s - Zudoku",
      ...config.metadata,
    },
    sidebars: configuredSidebar,
    topNavigation: config.topNavigation,
    mdx: config.mdx,
    authentication: configuredAuthProvider,
    plugins: [
      ...configuredDocsPlugins,
      ...configuredApiPlugins,
      ...(configuredSearchPlugin ? [configuredSearchPlugin] : []),
      ...(configuredRedirectPlugin ? [configuredRedirectPlugin] : []),
      ...(configuredApiKeysPlugin ? [configuredApiKeysPlugin] : []),
      ...(configuredCustomPagesPlugin ? [configuredCustomPagesPlugin] : []),
      ...configuredApiCatalogPlugins,
      ...(configuredAuthProvider?.getAuthenticationPlugin
        ? [configuredAuthProvider.getAuthenticationPlugin()]
        : []),
      ...(config.plugins ?? []),
    ],
  };
};

export const getRoutesByOptions = (
  options: ZudokuContextOptions,
  enableStatusPages = false,
) => {
  const allPlugins = [
    ...(options.plugins ? options.plugins : []),
    ...(options.authentication?.getAuthenticationPlugin
      ? [options.authentication.getAuthenticationPlugin()]
      : []),
  ];

  const routes = allPlugins
    .flatMap((plugin) => (isNavigationPlugin(plugin) ? plugin.getRoutes() : []))
    .concat(
      enableStatusPages
        ? [400, 403, 404, 405, 414, 416, 500, 501, 502, 503, 504].map(
            (statusCode) => ({
              path: `/.static/${statusCode}`,
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

  return routes;
};

export const getRoutesByConfig = (config: ZudokuConfig): RouteObject[] => {
  const options = convertZudokuConfigToOptions(config);
  const routes = getRoutesByOptions(options, config.enableStatusPages);

  return [
    {
      element: (
        <Zudoku {...options}>
          <Layout />
        </Zudoku>
      ),
      children: [
        {
          errorElement: <RouterError />,
          children: routes,
        },
      ],
    },
  ];
};
