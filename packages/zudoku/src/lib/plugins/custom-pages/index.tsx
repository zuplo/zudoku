import type { ReactNode } from "react";
import type { RouteObject } from "react-router";
import type { NavigationItem } from "../../../config/validators/NavigationSchema.js";
import { traverseNavigation } from "../../components/navigation/utils.js";
import type { NavigationPlugin } from "../../core/plugins.js";

export type CustomPageConfig = {
  path: string;
  element?: ReactNode;
};

export const customPagesPlugin = (
  navigation: NavigationItem[] = [],
): NavigationPlugin => ({
  getRoutes: (): RouteObject[] => {
    const customPages: RouteObject[] = [];

    traverseNavigation(navigation, (item) => {
      if (item.type === "custom-page") {
        customPages.push({
          path: item.path,
          element: item.element,
          handle: {
            layout: item.layout ?? "default",
          },
        });
      }
    });

    return customPages;
  },
});
