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
  };
};
