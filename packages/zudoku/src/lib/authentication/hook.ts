import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { useNavigate } from "react-router";
import { RenderContext } from "../components/context/RenderContext.js";
import { useZudoku } from "../components/context/ZudokuContext.js";
import type { AuthActionOptions } from "./authentication.js";
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
  const { authentication } = useZudoku();
  const authState = useAuthState();
  const isAuthEnabled = typeof authentication !== "undefined";
  const navigate = useNavigate();

  useRefreshUserProfile();

  // On the server, the zustand store can't read window.ZUDOKU_SSR_AUTH,
  // so we override from RenderContext which carries the per-request auth state
  const { ssrAuth } = use(RenderContext);
  const isSSR = typeof window === "undefined";

  return {
    isAuthEnabled,
    ...authState,
    ...(isSSR &&
      ssrAuth && {
        isAuthenticated: true,
        isPending: false,
        profile: ssrAuth.profile,
      }),

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
