import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useZudoku } from "../components/context/ZudokuContext.js";
import type { AuthActionOptions } from "./authentication.js";
import { useAuthState } from "./state.js";

export type UseAuthReturn = ReturnType<typeof useAuth>;

export const useAuth = () => {
  const { authentication } = useZudoku();
  const authState = useAuthState();
  const isAuthEnabled = typeof authentication !== "undefined";
  const navigate = useNavigate();

  useQuery({
    queryKey: ["auth-state"],
    queryFn: async () => {
      // keep refreshing the user profile if the email is not verified
      if (authState.isAuthenticated && !authState.profile?.emailVerified) {
        await authentication?.refreshUserProfile?.();
      }
      return true;
    },
  });

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

      // Redirect to home
      void navigate("/", { replace: true });
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
    supportsEmailVerification:
      typeof authentication?.requestEmailVerification === "function",

    requestEmailVerification: async (options?: AuthActionOptions) => {
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
