import { redirect, type RouteObject } from "react-router-dom";
import { configuredApiKeysPlugin } from "virtual:zudoku-api-keys-plugin";
import { configuredApiPlugins } from "virtual:zudoku-api-plugins";
import { configuredAuthProvider } from "virtual:zudoku-auth";
import { configuredCustomPagesPlugin } from "virtual:zudoku-custom-pages-plugin";
import { configuredDocsPlugins } from "virtual:zudoku-docs-plugins";
import { configuredRedirectPlugin } from "virtual:zudoku-redirect-plugin";
import { configuredSidebar } from "virtual:zudoku-sidebar";
import "virtual:zudoku-theme.css";
import { DevPortal, Layout, RouterError } from "zudoku/components";
import { isNavigationPlugin } from "zudoku/internal";
import { inkeepSearchPlugin } from "zudoku/plugins/search-inkeep";
import type { ZudokuConfig } from "../config/config.js";
import { traverseSidebar } from "../lib/components/navigation/utils.js";
import type { ZudokuContextOptions } from "../lib/core/DevPortalContext.js";
import { joinPath } from "../lib/util/joinPath.js";

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
      ...(config.search?.type === "inkeep"
        ? [inkeepSearchPlugin(config.search)]
        : []),
      ...configuredDocsPlugins,
      ...configuredApiPlugins,
      ...(configuredRedirectPlugin ? [configuredRedirectPlugin] : []),
      ...(configuredApiKeysPlugin ? [configuredApiKeysPlugin] : []),
      ...(configuredCustomPagesPlugin ? [configuredCustomPagesPlugin] : []),
      ...(configuredAuthProvider?.getAuthenticationPlugin
        ? [configuredAuthProvider.getAuthenticationPlugin()]
        : []),
      ...(config.plugins ?? []),
    ],
  };
};

export const getRoutesByConfig = (config: ZudokuConfig): RouteObject[] => {
  const options = convertZudokuConfigToOptions(config);

  const allPlugins = [
    ...(options.plugins ? options.plugins : []),
    ...(options.authentication?.getAuthenticationPlugin
      ? [options.authentication.getAuthenticationPlugin()]
      : []),
  ];

  const topNavRedirects =
    options.topNavigation?.flatMap((topNavItem) => {
      if (!options.sidebars?.[topNavItem.id]) return [];

      const first =
        topNavItem.default ??
        traverseSidebar(options.sidebars[topNavItem.id], (item) => {
          if (item.type === "doc") return joinPath(topNavItem.id, item.id);
        });

      if (!first) return [];

      return {
        path: topNavItem.id,
        loader: () => redirect(joinPath(first)),
      } satisfies RouteObject;
    }) ?? [];

  const routes = allPlugins
    .flatMap((plugin) => (isNavigationPlugin(plugin) ? plugin.getRoutes() : []))
    .concat(topNavRedirects)
    .concat({
      path: "*",
      loader: () => {
        throw new Response("Not Found", { status: 404 });
      },
    });

  return [
    {
      element: (
        <DevPortal {...options}>
          <Layout />
        </DevPortal>
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
