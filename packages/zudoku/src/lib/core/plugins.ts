import type { LucideProps } from "lucide-react";
import { type ReactElement } from "react";
import { type RouteObject } from "react-router-dom";
import type { Sidebar } from "../../config/validators/SidebarSchema.js";
import { MdxComponentsType } from "../util/MdxComponents.js";
import { ZudokuContext, type ApiIdentity } from "./ZudokuContext.js";

export type ZudokuPlugin =
  | CommonPlugin
  | ProfileMenuPlugin
  | NavigationPlugin
  | ApiIdentityPlugin
  | SearchProviderPlugin;

export type { RouteObject };

export interface NavigationPlugin {
  getRoutes: () => RouteObject[];
  getSidebar?: (path: string) => Promise<Sidebar>;
}

export interface ApiIdentityPlugin {
  getIdentities: (context: ZudokuContext) => Promise<ApiIdentity[]>;
}

export interface SearchProviderPlugin {
  renderSearch: (o: {
    isOpen: boolean;
    onClose: () => void;
  }) => React.JSX.Element | null;
}

export interface ProfileMenuPlugin {
  getProfileMenuItems: (context: ZudokuContext) => ProfileNavigationItem[];
}

export type ProfileNavigationItem = {
  label: string;
  path?: string;
  weight?: number;
  category?: "top" | "middle" | "bottom";
  children?: ProfileNavigationItem[];
  icon?: React.ComponentType<
    LucideProps & {
      [key: string]: any;
    }
  >;
};

export interface CommonPlugin {
  initialize?: (
    context: ZudokuContext,
  ) => Promise<void | boolean> | void | boolean;
  getHead?: () => ReactElement | undefined;
  getMdxComponents?: () => MdxComponentsType;
}

export const isProfileMenuPlugin = (
  obj: ZudokuPlugin,
): obj is ProfileMenuPlugin =>
  "getProfileMenuItems" in obj && typeof obj.getProfileMenuItems === "function";

export const isNavigationPlugin = (
  obj: ZudokuPlugin,
): obj is NavigationPlugin =>
  "getRoutes" in obj && typeof obj.getRoutes === "function";

export const isSearchPlugin = (
  obj: ZudokuPlugin,
): obj is SearchProviderPlugin =>
  "renderSearch" in obj && typeof obj.renderSearch === "function";

export const needsInitialization = (obj: ZudokuPlugin): obj is CommonPlugin =>
  "initialize" in obj && typeof obj.initialize === "function";

export const hasHead = (obj: ZudokuPlugin): obj is CommonPlugin =>
  "getHead" in obj && typeof obj.getHead === "function";

export const isMdxProviderPlugin = (obj: ZudokuPlugin): obj is CommonPlugin =>
  "getMdxComponents" in obj && typeof obj.getMdxComponents === "function";

export const isApiIdentityPlugin = (
  obj: ZudokuPlugin,
): obj is ApiIdentityPlugin =>
  "getIdentities" in obj && typeof obj.getIdentities === "function";
