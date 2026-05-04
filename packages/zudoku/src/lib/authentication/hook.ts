import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useZudoku } from "../components/context/ZudokuContext.js";
import type { AuthActionOptions } from "./authentication.js";
import { readPersistedAuthState, useAuthState } from "./state.js";

export type UseAuthReturn = ReturnType<typeof useAuth>;

/**
 * Refreshes the user profile from the authentication provider.
 *
 * This gets called when the user profile needs to be refreshed (e.g. to check if the email is verified)
 */
export const useRefreshUserProfile = ({
  refetchOnWindowFocus,
  refetchOnMount,
}: {
  refetchOnWindowFocus?: boolean | "always";
  refetchOnMount?: boolean | "always";
} = {}) => {
  const { authentication } = useZudoku();
  const isAuthEnabled = typeof authentication !== "undefined";

  return useQuery({
    refetchOnWindowFocus,
    refetchOnMount,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    queryKey: ["refresh-user-profile"],
    enabled:
      isAuthEnabled && typeof authentication?.refreshUserProfile === "function",
    queryFn: async () => {
      const result = await authentication?.refreshUserProfile?.();
      useAuthState.setState({ profileFetchedAt: Date.now() });
      return result;
    },
    initialData: () => (readPersistedAuthState()?.profile ? true : undefined),
    initialDataUpdatedAt: () => {
      const ts = readPersistedAuthState()?.profileFetchedAt;
      return typeof ts === "number" ? ts : undefined;
    },
  });
};

export const useVerifiedEmail = () => {
  const { authentication } = useZudoku();
  const authState = useAuthState();
  const navigate = useNavigate();
  const isAuthEnabled = typeof authentication !== "undefined";

  const isUnverified = authState.profile?.emailVerified === false;

  const { refetch: refreshUserProfile } = useRefreshUserProfile({
    refetchOnWindowFocus: isUnverified ? "always" : true,
    refetchOnMount: isUnverified ? "always" : undefined,
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

  return {
    isAuthEnabled,
    ...authState,

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
