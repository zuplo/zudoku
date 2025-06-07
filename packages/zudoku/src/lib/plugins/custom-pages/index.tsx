import { type ComponentType, type ReactNode } from "react";
import type { RouteObject } from "react-router";
import type { NavigationItem } from "../../../config/validators/NavigationSchema.js";
import { traverseNavigation } from "../../components/navigation/utils.js";
import type { NavigationPlugin } from "../../core/plugins.js";
import type { ExposedComponentProps } from "../../util/useExposedProps.js";
import { CustomPage } from "./CustomPage.js";

export type CustomPageConfig = {
  path: string;
  prose?: boolean;
  element?: ReactNode;
  render?: ComponentType<ExposedComponentProps>;
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
          element: <CustomPage {...item} />,
        });
      }
    });

    return customPages;
  },
});
