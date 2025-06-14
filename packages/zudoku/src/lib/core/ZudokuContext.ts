import type { QueryClient } from "@tanstack/react-query";
import { createNanoEvents } from "nanoevents";
import type { ReactNode } from "react";
import type { Location } from "react-router";
import type { BundledTheme, HighlighterCore } from "shiki";
import type { z } from "zod/v4";
import type { Navigation } from "../../config/validators/NavigationSchema.js";
import type { FooterSchema } from "../../config/validators/validate.js";
import type { AuthenticationPlugin } from "../authentication/authentication.js";
import { type AuthState, useAuthState } from "../authentication/state.js";
import type { ComponentsContextType } from "../components/context/ComponentsContext.js";
import type { SlotType } from "../components/context/SlotProvider.js";
import { joinUrl } from "../util/joinUrl.js";
import type { MdxComponentsType } from "../util/MdxComponents.js";
import { objectEntries } from "../util/objectEntries.js";
import {
  isApiIdentityPlugin,
  isAuthenticationPlugin,
  isEventConsumerPlugin,
  isNavigationPlugin,
  type NavigationPlugin,
  needsInitialization,
  type ZudokuPlugin,
} from "./plugins.js";

export interface ZudokuEvents {
  location: (event: { from?: Location; to: Location }) => void;
  auth: (auth: { prev: AuthState; next: AuthState }) => void;
}

export interface ApiIdentity {
  authorizeRequest: (request: Request) => Promise<Request> | Request;
  authorizationFields?: {
    headers?: string[];
    queryParams?: string[];
  };
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
  dir?: "ltr" | "rtl";
  showPoweredBy?: boolean;
  pageTitle?: string;
  logo?: {
    src: {
      light: string;
      dark: string;
    };
    width?: string | number;
    alt?: string;
  };
  banner?: {
    message: ReactNode;
    color?: "note" | "tip" | "info" | "caution" | "danger" | (string & {});
    dismissible?: boolean;
  };
  footer?: z.infer<typeof FooterSchema>;
}>;

export type ZudokuContextOptions = {
  basePath?: string;
  canonicalUrlOrigin?: string;
  metadata?: Metadata;
  page?: Page;
  authentication?: AuthenticationPlugin;
  navigation?: Navigation;
  plugins?: ZudokuPlugin[];
  slots?: Record<string, SlotType>;
  /**
   * @deprecated Use `slots` instead
   */
  UNSAFE_slotlets?: Record<string, SlotType>;
  mdx?: {
    components?: MdxComponentsType;
  };
  overrides?: ComponentsContextType;
  protectedRoutes?: string[];
  syntaxHighlighting?: {
    highlighter: HighlighterCore;
    themes?: { light: BundledTheme; dark: BundledTheme };
  };
};

export class ZudokuContext {
  public plugins: NonNullable<ZudokuContextOptions["plugins"]>;
  public navigation: Navigation;
  public meta: ZudokuContextOptions["metadata"];
  public page: ZudokuContextOptions["page"];
  public readonly authentication?: ZudokuContextOptions["authentication"];
  public readonly queryClient: QueryClient;
  public readonly options: ZudokuContextOptions;
  private readonly navigationPlugins: NavigationPlugin[];
  private emitter = createNanoEvents<ZudokuEvents>();

  constructor(options: ZudokuContextOptions, queryClient: QueryClient) {
    const protectedRoutes = (options.protectedRoutes ?? []).concat(
      options.plugins?.flatMap((plugin) =>
        isNavigationPlugin(plugin) ? (plugin.getProtectedRoutes?.() ?? []) : [],
      ) ?? [],
    );

    this.queryClient = queryClient;
    this.options = { ...options, protectedRoutes };
    this.plugins = options.plugins ?? [];
    this.navigation = options.navigation ?? [];
    this.navigationPlugins = this.plugins.filter(isNavigationPlugin);
    this.authentication = this.plugins.find(isAuthenticationPlugin);
    this.meta = options.metadata;
    this.page = options.page;
    this.plugins.forEach((plugin) => {
      if (!isEventConsumerPlugin(plugin)) return;

      objectEntries(plugin.events).forEach(([event, handler]) => {
        this.emitter.on(event, handler!);
      });
    });

    useAuthState.subscribe((state, prevState) => {
      this.emitEvent("auth", {
        prev: prevState,
        next: state,
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

    return keys.flat();
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

  getPluginNavigation = async (path: string) => {
    const navigations = await Promise.all(
      this.navigationPlugins.map((plugin) =>
        plugin.getNavigation?.(joinUrl(path), this),
      ),
    );

    return navigations.flatMap((nav) => nav ?? []);
  };

  signRequest = async (request: Request) => {
    if (!this.authentication) {
      throw new Error("No authentication provider configured");
    }

    const { headers, body, queryParams } =
      await this.authentication.signRequest(request);

    const newUrl = new URL(request.url);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        newUrl.searchParams.set(key, value);
      });
    }

    return new Request(newUrl.toString(), {
      method: request.method,
      headers: {
        ...request.headers,
        ...headers,
      },
      body: body ?? request.body,
      mode: request.mode,
      credentials: request.credentials,
    });
  };
}
