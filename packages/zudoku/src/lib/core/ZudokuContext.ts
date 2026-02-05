import type { QueryClient } from "@tanstack/react-query";
import { createNanoEvents } from "nanoevents";
import type { ReactNode } from "react";
import type { Location } from "react-router";
import type { BundledTheme, HighlighterCore } from "shiki";
import type { z } from "zod";
import type { Navigation } from "../../config/validators/NavigationSchema.js";
import type {
  CallbackContext,
  ProtectedRoutesInput,
} from "../../config/validators/ProtectedRoutesSchema.js";
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
  isProfileMenuPlugin,
  needsInitialization,
  type ProfileNavigationItem,
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
  defaultTitle?: string;
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

type Site = Partial<{
  dir?: "ltr" | "rtl";
  showPoweredBy?: boolean;
  title?: string;
  logo?: {
    src: {
      light: string;
      dark: string;
    };
    width?: string | number;
    alt?: string;
    href?: string;
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
  site?: Site;
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
  protectedRoutes?: ProtectedRoutesInput;
  syntaxHighlighting?: {
    highlighter: HighlighterCore;
    themes?: { light: BundledTheme; dark: BundledTheme };
  };
};

export const normalizeProtectedRoutes = (
  val: ProtectedRoutesInput,
): Record<string, (c: CallbackContext) => boolean> | undefined => {
  if (!val) return undefined;

  if (Array.isArray(val)) {
    return Object.fromEntries(
      val.map((route) => [
        route,
        (c: CallbackContext) => c.auth.isAuthenticated,
      ]),
    );
  }

  return val;
};

export class ZudokuContext {
  public readonly authentication?: AuthenticationPlugin;
  public readonly getAuthState: () => AuthState;
  public readonly queryClient: QueryClient;
  public readonly options: ZudokuContextOptions;
  public readonly env: Record<string, string | undefined>;
  public readonly protectedRoutes: ReturnType<typeof normalizeProtectedRoutes>;
  private readonly plugins: NonNullable<ZudokuContextOptions["plugins"]>;
  private readonly emitter = createNanoEvents<ZudokuEvents>();

  constructor(
    options: ZudokuContextOptions,
    queryClient: QueryClient,
    env: Record<string, string | undefined>,
  ) {
    this.queryClient = queryClient;
    this.env = env;
    this.options = options;
    this.plugins = options.plugins ?? [];
    this.authentication = this.plugins.find(isAuthenticationPlugin);
    this.getAuthState = useAuthState.getState;

    const pluginProtectedRoutes = Object.fromEntries(
      this.plugins.flatMap((plugin) => {
        if (!isNavigationPlugin(plugin)) return [];
        const routes = plugin.getProtectedRoutes?.();
        if (!routes) return [];

        return Object.entries(normalizeProtectedRoutes(routes) ?? {});
      }),
    );

    this.protectedRoutes = {
      ...pluginProtectedRoutes,
      ...normalizeProtectedRoutes(options.protectedRoutes),
    };

    this.plugins.forEach((plugin) => {
      if (!isEventConsumerPlugin(plugin)) return;

      objectEntries(plugin.events).forEach(([event, handler]) => {
        // biome-ignore lint/style/noNonNullAssertion: handler is guaranteed to be defined
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
      this.plugins
        .filter(isNavigationPlugin)
        .map((plugin) => plugin.getNavigation?.(joinUrl(path), this)),
    );

    return navigations.flatMap((nav) => nav ?? []);
  };

  getProfileMenuItems = () => {
    const accountItems = this.plugins
      .filter((p) => isProfileMenuPlugin(p))
      .flatMap((p) => p.getProfileMenuItems(this))
      .sort(sortByCategory(["top", "middle", "bottom"]))
      .sort((i) => i.weight ?? 0);

    return accountItems;
  };

  signRequest = async (request: Request) => {
    if (!this.authentication) {
      throw new Error("No authentication provider configured");
    }

    return await this.authentication.signRequest(request);
  };
}

const sortByCategory =
  (categories: string[]) =>
  (a: ProfileNavigationItem, b: ProfileNavigationItem) => {
    const aIndex = categories.indexOf(a.category ?? "middle");
    const bIndex = categories.indexOf(b.category ?? "middle");

    return aIndex - bIndex;
  };
