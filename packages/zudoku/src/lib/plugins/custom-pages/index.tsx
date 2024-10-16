import { type ComponentType, type ReactNode } from "react";
import type { RouteObject } from "react-router-dom";
import { type ExposedComponentProps } from "../../components/SlotletProvider.js";
import type { DevPortalPlugin, NavigationPlugin } from "../../core/plugins.js";
import { CustomPage } from "./CustomPage.js";

export type CustomPageConfig = {
  path: string;
  prose?: boolean;
  element?: ReactNode;
  render?: ComponentType<ExposedComponentProps>;
};

export const customPagesPlugin = (
  config: CustomPageConfig[],
): DevPortalPlugin & NavigationPlugin => {
  return {
    getRoutes: (): RouteObject[] =>
      config.map(({ path, ...props }) => ({
        path,
        element: <CustomPage {...props} />,
      })),
  };
};
