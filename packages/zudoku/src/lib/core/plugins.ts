import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import type { Location, RouteObject } from "react-router";
import type { Sidebar } from "../../config/validators/SidebarSchema.js";
import type { MdxComponentsType } from "../util/MdxComponents.js";
import type {
  ApiIdentity,
  ZudokuContext,
  ZudokuEvents,
} from "./ZudokuContext.js";

export type ZudokuPlugin =
  | CommonPlugin
  | ProfileMenuPlugin
  | NavigationPlugin
  | ApiIdentityPlugin
  | SearchProviderPlugin
  | EventConsumerPlugin;

export type { RouteObject };

export interface NavigationPlugin {
  getRoutes: () => RouteObject[];
  getSidebar?: (path: string, context: ZudokuContext) => Promise<Sidebar>;
}

export const createApiIdentityPlugin = (
  plugin: ApiIdentityPlugin,
): ApiIdentityPlugin => plugin;

export const createProfileMenuPlugin = (
  plugin: ProfileMenuPlugin,
): ProfileMenuPlugin => plugin;

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
  icon?: LucideIcon;
};

export interface CommonPlugin {
  initialize?: (
    context: ZudokuContext,
  ) => Promise<void | boolean> | void | boolean;
  getHead?: ({ location }: { location: Location }) => ReactElement | undefined;
  getMdxComponents?: () => MdxComponentsType;
}

export type EventConsumerPlugin<Event extends ZudokuEvents = ZudokuEvents> = {
  events: { [K in keyof Event]?: Event[K] };
};

export const isEventConsumerPlugin = (
  obj: ZudokuPlugin,
): obj is EventConsumerPlugin =>
  "events" in obj && typeof obj.events === "object";

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
