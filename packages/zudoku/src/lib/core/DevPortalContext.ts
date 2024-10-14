import { QueryClient } from "@tanstack/react-query";
import { ReactNode } from "react";
import type { SidebarConfig } from "../../config/validators/SidebarSchema.js";
import { type AuthenticationProvider } from "../authentication/authentication.js";
import type { ComponentsContextType } from "../components/context/ComponentsContext.js";
import { Slotlets } from "../components/SlotletProvider.js";
import { joinPath } from "../util/joinPath.js";
import type { MdxComponentsType } from "../util/MdxComponents.js";
import {
  type DevPortalPlugin,
  isApiIdentityPlugin,
  isNavigationPlugin,
  type NavigationPlugin,
  needsInitialization,
} from "./plugins.js";

export interface ApiIdentity {
  authorizeRequest: (request: Request) => Request;
  label: string;
  id: string;
}

export const queryClient = new QueryClient();

export type ApiKeyCache = "api-keys";
export type DevPortalCacheKey = ApiKeyCache | string;

type Metadata = Partial<{
  title: string;
  description: string;
  logo: string;
  favicon: string;
  generator: string;
  applicationName: string;
  referrer: string;
  keywords: string[];
  authors: string[];
  creator: string;
  publisher: string;
}>;

type Page = Partial<{
  pageTitle?: string;
  logo?: {
    src: {
      light: string;
      dark: string;
    };
    width?: string;
    alt?: string;
  };
  banner?: {
    message: ReactNode;
    color?: "note" | "tip" | "info" | "caution" | "danger" | (string & {});
    dismissible?: boolean;
  };
}>;

export type ZudokuContextOptions = {
  metadata?: Metadata;
  page?: Page;
  authentication?: AuthenticationProvider;
  topNavigation?: Array<{ id: string; label: string; default?: string }>;
  sidebars?: SidebarConfig;
  plugins?: DevPortalPlugin[];
  slotlets?: Slotlets;
  mdx?: {
    components?: MdxComponentsType;
  };
  overrides?: ComponentsContextType;
};

export class DevPortalContext {
  public plugins: NonNullable<ZudokuContextOptions["plugins"]>;
  public sidebars: NonNullable<ZudokuContextOptions["sidebars"]>;
  public topNavigation: NonNullable<ZudokuContextOptions["topNavigation"]>;
  public meta: ZudokuContextOptions["metadata"];
  public page: ZudokuContextOptions["page"];
  public authentication?: ZudokuContextOptions["authentication"];
  private navigationPlugins: NavigationPlugin[];

  constructor(config: ZudokuContextOptions) {
    this.plugins = config.plugins ?? [];
    this.topNavigation = config.topNavigation ?? [];
    this.sidebars = config.sidebars ?? {};
    this.navigationPlugins = this.plugins.filter(isNavigationPlugin);
    this.authentication = config.authentication;
    this.meta = config.metadata;
    this.page = config.page;
  }

  initialize = async (): Promise<void> => {
    await Promise.all(
      this.plugins
        .filter(needsInitialization)
        .map((plugin) => plugin.initialize?.(this)),
    );
  };

  invalidateCache = async (key: DevPortalCacheKey[]) => {
    await queryClient.invalidateQueries({ queryKey: key });
  };

  getApiIdentities = async () => {
    const keys = await Promise.all(
      this.plugins
        .filter(isApiIdentityPlugin)
        .map((plugin) => plugin.getIdentities(this)),
    );

    return keys.flat();
  };

  getPluginSidebar = async (path: string) => {
    const navigations = await Promise.all(
      this.navigationPlugins.map((plugin) =>
        plugin.getSidebar?.(joinPath(path)),
      ),
    );

    return navigations.flatMap((nav) => nav ?? []);
  };

  signRequest = async (request: Request) => {
    if (!this.authentication) {
      throw new Error("No authentication provider configured");
    }

    const accessToken = await this.authentication.getAccessToken();

    request.headers.set("Authorization", `Bearer ${accessToken}`);

    return request;
  };
}
