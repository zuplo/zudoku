import type { ReactNode } from "react";
import type { RouteObject } from "react-router-dom";
import { ProseClasses } from "../../components/Markdown.js";
import type { DevPortalPlugin, NavigationPlugin } from "../../core/plugins.js";

type CustomPagesConfig = Array<{
  path: string;
  element: ReactNode;
}>;

export const customPagesPlugin = (
  config: CustomPagesConfig,
): DevPortalPlugin & NavigationPlugin => {
  return {
    getRoutes: (): RouteObject[] =>
      config.map(({ path, element }) => ({
        path,
        // TODO: we should componentize prose pages
        element: <div className={ProseClasses + " max-w-full"}>{element}</div>,
      })),
  };
};
