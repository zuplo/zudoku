import { ReactNode } from "react";
import { TopNavigationItem } from "../../config/validators/common.js";
import type { SidebarConfig } from "../../config/validators/SidebarSchema.js";
import { type AuthenticationProvider } from "../authentication/authentication.js";
import type { ComponentsContextType } from "../components/context/ComponentsContext.js";
import { Slotlets } from "../components/SlotletProvider.js";
import { joinPath } from "../util/joinPath.js";
import type { MdxComponentsType } from "../util/MdxComponents.js";
import {
  isApiIdentityPlugin,
  isNavigationPlugin,
  type NavigationPlugin,
  needsInitialization,
  type ZudokuPlugin,
} from "./plugins.js";

export interface ApiIdentity {
  authorizeRequest: (request: Request) => Request;
  label: string;
  id: string;
}

export type ApiKeyCache = "api-keys";

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
  topNavigation?: TopNavigationItem[];
  sidebars?: SidebarConfig;
  plugins?: ZudokuPlugin[];
  slotlets?: Slotlets;
  mdx?: {
    components?: MdxComponentsType;
  };
  overrides?: ComponentsContextType;
  protectedRoutes?: string[];
};

export class ZudokuContext {
  public plugins: NonNullable<ZudokuContextOptions["plugins"]>;
  public sidebars: SidebarConfig;
  public topNavigation: NonNullable<ZudokuContextOptions["topNavigation"]>;
  public meta: ZudokuContextOptions["metadata"];
  public page: ZudokuContextOptions["page"];
  public authentication?: ZudokuContextOptions["authentication"];
  private readonly navigationPlugins: NavigationPlugin[];

  constructor(public readonly options: ZudokuContextOptions) {
    this.plugins = options.plugins ?? [];
    this.topNavigation = options.topNavigation ?? [];
    this.sidebars = options.sidebars ?? {};
    this.navigationPlugins = this.plugins.filter(isNavigationPlugin);
    this.authentication = options.authentication;
    this.meta = options.metadata;
    this.page = options.page;
  }

  initialize = async (): Promise<void> => {
    await Promise.all(
      this.plugins
        .filter(needsInitialization)
        .map((plugin) => plugin.initialize?.(this)),
    );
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
