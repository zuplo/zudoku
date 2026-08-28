import { useQuery } from "@tanstack/react-query";
import { use, useEffect } from "react";
import { useNavigate } from "react-router";
import { RenderContext } from "../components/context/RenderContext.js";
import { useZudoku } from "../components/context/ZudokuContext.js";
import type { AuthActionOptions } from "./authentication.js";
import { withMetadataTimeout } from "./metadata.js";
import { useAuthState } from "./state.js";

export type UseAuthReturn = ReturnType<typeof useAuth>;

/**
 * Refreshes the user profile from the authentication provider.
 *
 * This gets called when the user profile needs to be refreshed (e.g. to check if the email is verified)
 */
export const useRefreshUserProfile = ({
  refetchOnWindowFocus,
}: {
  refetchOnWindowFocus?: boolean | "always";
} = {}) => {
  const { authentication } = useZudoku();
  const isAuthEnabled = typeof authentication !== "undefined";

  return useQuery({
    refetchOnWindowFocus,
    queryKey: ["refresh-user-profile"],
    enabled:
      isAuthEnabled && typeof authentication?.refreshUserProfile === "function",
    queryFn: () => authentication?.refreshUserProfile?.(),
  });
};

/**
 * Loads `authentication.getMetadata` into `profile.metadata`.
 *
 * Keyed on `sub` so login, logout and user switches are handled without
 * subscribing to auth events — a subscriber that wrote back into the store
 * would re-trigger itself.
 */
export const useUserMetadata = () => {
  const context = useZudoku();
  const { getUserMetadata } = context;
  const { isAuthenticated, profile } = useAuthState();
  const sub = profile?.sub;
  const isEnabled = Boolean(getUserMetadata) && isAuthenticated && Boolean(sub);

  const query = useQuery({
    queryKey: ["user-metadata", sub],
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    // One retry covers a transient blip; more would leave metadata-gated
    // routes undecided for several seconds.
    retry: 1,
    queryFn: async ({ signal }) => {
      const currentProfile = useAuthState.getState().profile;
      if (!getUserMetadata || !currentProfile) return null;

      const metadata = await getUserMetadata({
        profile: currentProfile,
        context,
        signRequest: (request) => context.signRequest(request),
        signal: withMetadataTimeout(signal),
      });

      useAuthState.setState((state) =>
        state.profile ? { profile: { ...state.profile, metadata } } : {},
      );

      return metadata ?? null;
    },
  });

  const { isError, error } = query;

  // Fail closed once the retries are exhausted: drop any previous value so a
  // stale entitlement can't outlive a failing lookup.
  useEffect(() => {
    if (!isError) return;

    // biome-ignore lint/suspicious/noConsole: Surface metadata failures
    console.error("[Zudoku] Failed to load user metadata:", error);

    useAuthState.setState((state) =>
      state.profile
        ? { profile: { ...state.profile, metadata: undefined } }
        : {},
    );
  }, [isError, error]);

  return {
    ...query,
    // `isPending` is also true while the query is disabled, so gate on it.
    isMetadataPending: isEnabled && query.status === "pending",
  };
};

export const useVerifiedEmail = () => {
  const { authentication } = useZudoku();
  const authState = useAuthState();
  const navigate = useNavigate();
  const isAuthEnabled = typeof authentication !== "undefined";

  const { refetch: refreshUserProfile } = useRefreshUserProfile({
    refetchOnWindowFocus: "always",
  });

  return {
    email: authState.profile?.email,
    isVerified: authState.profile?.emailVerified,
    supportsEmailVerification:
      typeof authentication?.requestEmailVerification === "function",
    refresh: () => void refreshUserProfile(),
    requestEmailVerification: async (options?: AuthActionOptions) => {
      if (process.env.NODE_ENV === "development") {
        // biome-ignore lint: We want to warn about the deprecation
        console.warn(
          "requestEmailVerification is deprecated. Use useVerifiedEmail.",
        );
      }
      if (!isAuthEnabled) {
        throw new Error("Authentication is not enabled.");
      }

      await authentication.requestEmailVerification?.(
        { navigate },
        {
          ...options,
          redirectTo: options?.redirectTo ?? window.location.href,
        },
      );
    },
  };
};

export const useAuth = () => {
  const context = useZudoku();
  const { authentication } = context;
  const authState = useAuthState();
  const isAuthEnabled = typeof authentication !== "undefined";
  const navigate = useNavigate();

  useRefreshUserProfile();
  const metadata = useUserMetadata();

  // On the server, the zustand store can't read window.ZUDOKU_SSR_AUTH, so
  // override from RenderContext which carries the per-request auth state.
  const { ssrAuth } = use(RenderContext);
  const isSSR = typeof window === "undefined";

  const isAuthenticated =
    isSSR && ssrAuth ? !!ssrAuth.profile : authState.isAuthenticated;

  return {
    isAuthEnabled,
    disableSignUp: authentication?.disableSignUp ?? false,
    ...authState,
    ...(isSSR &&
      ssrAuth && {
        isAuthenticated,
        isPending: false,
        profile: ssrAuth.profile,
      }),

    /**
     * True while `authentication.getMetadata` has not resolved for the current
     * user. Always true during SSR, where metadata is never loaded — route
     * guards must treat it as "undecided" rather than denying access.
     */
    isMetadataPending:
      Boolean(context.getUserMetadata) &&
      isAuthenticated &&
      (isSSR || metadata.isMetadataPending),

    /** Reloads `profile.metadata`, e.g. after a plan change. */
    refreshMetadata: () => void metadata.refetch(),

    login: async (options?: AuthActionOptions) => {
      if (!isAuthEnabled) {
        throw new Error("Authentication is not enabled.");
      }
      // TODO: Should handle errors/state
      await authentication.signIn(
        { navigate },
        {
          ...options,
          redirectTo: options?.redirectTo ?? window.location.href,
        },
      );
    },

    logout: async () => {
      if (!isAuthEnabled) {
        throw new Error("Authentication is not enabled.");
      }
      // TODO: Should handle errors/state
      await authentication.signOut({ navigate });
    },

    signup: async (options?: AuthActionOptions) => {
      if (!isAuthEnabled) {
        throw new Error("Authentication is not enabled.");
      }
      await authentication.signUp(
        { navigate },
        {
          ...options,
          redirectTo: options?.redirectTo ?? window.location.href,
        },
      );
    },

    requestEmailVerification: async (options?: AuthActionOptions) => {
      if (process.env.NODE_ENV === "development") {
        // biome-ignore lint: We want to warn about the deprecation
        console.warn(
          "requestEmailVerification is deprecated on useAuth. Use the requestEmailVerification method from useVerifiedEmail hook instead.",
        );
      }
      if (!isAuthEnabled) {
        throw new Error("Authentication is not enabled.");
      }

      await authentication.requestEmailVerification?.(
        { navigate },
        {
          ...options,
          redirectTo: options?.redirectTo ?? window.location.href,
        },
      );
    },
  };
};
