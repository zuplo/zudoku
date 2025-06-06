import { type ComponentType, type ReactNode } from "react";
import type { RouteObject } from "react-router";
import type { SidebarItem } from "../../../config/validators/SidebarSchema.js";
import { traverseSidebar } from "../../components/navigation/utils.js";
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
  navigation: SidebarItem[] = [],
): NavigationPlugin => ({
  getRoutes: (): RouteObject[] => {
    const customPages: RouteObject[] = [];

    traverseSidebar(navigation, (item) => {
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
