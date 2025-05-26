import { type ComponentType, type ReactNode } from "react";
import type { RouteObject } from "react-router";
import type { NavigationPlugin, ZudokuPlugin } from "../../core/plugins.js";
import type { ExposedComponentProps } from "../../util/useExposedProps.js";
import { CustomPage } from "./CustomPage.js";

export type CustomPageConfig = {
  path: string;
  prose?: boolean;
  element?: ReactNode;
  render?: ComponentType<ExposedComponentProps>;
};

export const customPagesPlugin = (
  config: CustomPageConfig[],
): ZudokuPlugin & NavigationPlugin => {
  return {
    getRoutes: (): RouteObject[] =>
      config.map(({ path, ...props }) => ({
        path,
        element: <CustomPage {...props} />,
      })),
  };
};
