import { type ComponentType, type ReactNode } from "react";
import type { RouteObject } from "react-router";
import type { InputSidebarItemCustomPage } from "../../../config/validators/InputSidebarSchema.js";
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
  navigation: InputSidebarItemCustomPage[] = [],
): NavigationPlugin => ({
  getRoutes: (): RouteObject[] =>
    navigation.map(({ path, ...props }) => ({
      path,
      element: <CustomPage {...props} />,
    })),
});
