import { useZudoku } from "../components/context/ZudokuContext.js";
import { useAuthState } from "./state.js";

export type UseAuthReturn = ReturnType<typeof useAuth>;

export const useAuth = () => {
  const { authentication } = useZudoku();
  const authState = useAuthState();
  const isAuthEnabled = typeof authentication !== "undefined";

  return {
    isAuthEnabled,
    ...authState,

    login: async () => {
      if (!isAuthEnabled) {
        throw new Error("Authentication is not enabled.");
      }

      // For providers with custom UI, navigate to signin page
      if (authentication.hasCustomUI) {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/signin?redirect=${encodeURIComponent(currentPath)}`;
        return;
      }

      // For OAuth providers, trigger redirect flow
      await authentication.signIn({
        redirectTo: window.location.href,
      });
    },

    logout: async () => {
      if (!isAuthEnabled) {
        throw new Error("Authentication is not enabled.");
      }
      // TODO: Should handle errors/state
      await authentication.signOut();

      // Redirect to home
      window.location.href = "/";
    },

    signup: async () => {
      if (!isAuthEnabled) {
        throw new Error("Authentication is not enabled.");
      }

      // For providers with custom UI, navigate to signup page
      if (authentication.hasCustomUI) {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/signup?redirect=${encodeURIComponent(currentPath)}`;
        return;
      }

      // For OAuth providers, trigger redirect flow
      await authentication.signUp({
        redirectTo: window.location.href,
      });
    },
  };
};
