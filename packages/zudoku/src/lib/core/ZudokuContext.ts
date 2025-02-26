import { createNanoEvents } from "nanoevents";
import { ReactNode } from "react";
import { Location } from "react-router";
import { TopNavigationItem } from "../../config/validators/common.js";
import type { SidebarConfig } from "../../config/validators/SidebarSchema.js";
import { type AuthenticationProvider } from "../authentication/authentication.js";
import type { ComponentsContextType } from "../components/context/ComponentsContext.js";
import { Slotlets } from "../components/SlotletProvider.js";
import { joinPath } from "../util/joinPath.js";
import type { MdxComponentsType } from "../util/MdxComponents.js";
import { objectEntries } from "../util/objectEntries.js";
import {
  isApiIdentityPlugin,
  isEventConsumerPlugin,
  isNavigationPlugin,
  type NavigationPlugin,
  needsInitialization,
  type ZudokuPlugin,
} from "./plugins.js";

export interface ZudokuEvents {
  location: (event: { from?: Location; to: Location }) => void;
}

export interface ZudokuEvents {
  location: (event: { from?: Location; to: Location }) => void;
}

export type RequestAuthorizationDetails = {
  headers?: Record<string, string>;
  body?: BodyInit;
  query?: Record<string, string>;
};

export type ActiveApiIdentity = ApiIdentity & {
  authorizeRequest: (request: Request) => Promise<Request> | Request;
};

export interface ApiIdentity {
  getRequestAuthorization: (
    request: Request,
    context: ZudokuContext,
  ) => Promise<RequestAuthorizationDetails> | RequestAuthorizationDetails;
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
  private emitter = createNanoEvents<ZudokuEvents>();

  constructor(public readonly options: ZudokuContextOptions) {
    this.plugins = options.plugins ?? [];
    this.topNavigation = options.topNavigation ?? [];
    this.sidebars = options.sidebars ?? {};
    this.navigationPlugins = this.plugins.filter(isNavigationPlugin);
    this.authentication = options.authentication;
    this.meta = options.metadata;
    this.page = options.page;

    this.plugins.forEach((plugin) => {
      if (!isEventConsumerPlugin(plugin)) return;

      objectEntries(plugin.events).forEach(([event, handler]) => {
        this.emitter.on(event, handler);
      });
    });
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

    return keys.flat().map(this.createActiveApiIdentity);
  };

  addEventListener<E extends keyof ZudokuEvents>(
    event: E,
    callback: ZudokuEvents[E],
  ) {
    return this.emitter.on(event, callback);
  }

  emitEvent = <E extends keyof ZudokuEvents>(
    event: E,
    ...data: Parameters<ZudokuEvents[E]>
  ) => {
    return this.emitter.emit(event, ...data);
  };

  getPluginSidebar = async (path: string) => {
    const navigations = await Promise.all(
      this.navigationPlugins.map((plugin) =>
        plugin.getSidebar?.(joinPath(path)),
      ),
    );

    return navigations.flatMap((nav) => nav ?? []);
  };

  private createActiveApiIdentity = (identity: ApiIdentity) => {
    return {
      ...identity,
      authorizeRequest: async (request) => {
        const newRequest = request.clone();
        const authorizationDetails = await identity.getRequestAuthorization(
          request,
          this,
        );

        const url = new URL(request.url);
        for (const [key, value] of Object.entries(authorizationDetails.headers ?? {})) {
          url.searchParams.set(key, value);
        }

        return new Request(url, {
          method: request.method.toUpperCase(),
          headers: {
            ...Object.fromEntries(newRequest.headers.entries()),
            ...authorizationDetails.headers,
          },
          body: authorizationDetails.body ?? newRequest.body ?? undefined,
        });
      },
    } satisfies ActiveApiIdentity;
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
