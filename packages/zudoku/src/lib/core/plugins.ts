import { type ReactElement } from "react";
import { type RouteObject } from "react-router-dom";
import type { Sidebar } from "../../config/validators/SidebarSchema.js";
import { MdxComponentsType } from "../util/MdxComponents.js";
import { DevPortalContext, type ApiIdentity } from "./DevPortalContext.js";

export type DevPortalPlugin =
  | CommonPlugin
  | ProfileMenuPlugin
  | NavigationPlugin
  | ApiIdentityPlugin
  | SearchProviderPlugin;

export interface NavigationPlugin {
  getRoutes: () => RouteObject[];
  getSidebar?: (path: string) => Promise<Sidebar>;
}

export interface ApiIdentityPlugin {
  getIdentities: (context: DevPortalContext) => Promise<ApiIdentity[]>;
}

export interface SearchProviderPlugin {
  renderSearch: (o: {
    isOpen: boolean;
    onClose: () => void;
  }) => React.JSX.Element | null;
}

export interface ProfileMenuPlugin {
  getProfileMenuItems: (context: DevPortalContext) => ProfileNavigationItem[];
}

export type ProfileNavigationItem = {
  label: string;
  path?: string;
  children?: ProfileNavigationItem[];
};

export interface CommonPlugin {
  initialize?: (
    context: DevPortalContext,
  ) => Promise<void | boolean> | void | boolean;
  getHead?: () => ReactElement | undefined;
  getMdxComponents?: () => MdxComponentsType;
}

export const isProfileMenuPlugin = (
  obj: DevPortalPlugin,
): obj is ProfileMenuPlugin =>
  "getProfileMenuItems" in obj && typeof obj.getProfileMenuItems === "function";

export const isNavigationPlugin = (
  obj: DevPortalPlugin,
): obj is NavigationPlugin =>
  "getRoutes" in obj && typeof obj.getRoutes === "function";

export const isSearchPlugin = (
  obj: DevPortalPlugin,
): obj is SearchProviderPlugin =>
  "renderSearch" in obj && typeof obj.renderSearch === "function";

export const needsInitialization = (
  obj: DevPortalPlugin,
): obj is CommonPlugin =>
  "initialize" in obj && typeof obj.initialize === "function";

export const hasHead = (obj: DevPortalPlugin): obj is CommonPlugin =>
  "getHead" in obj && typeof obj.getHead === "function";

export const isMdxProviderPlugin = (
  obj: DevPortalPlugin,
): obj is CommonPlugin =>
  "getMdxComponents" in obj && typeof obj.getMdxComponents === "function";

export const isApiIdentityPlugin = (
  obj: DevPortalPlugin,
): obj is ApiIdentityPlugin =>
  "getIdentities" in obj && typeof obj.getIdentities === "function";
