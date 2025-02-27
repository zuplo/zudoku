import { useZudoku } from "../components/context/ZudokuContext.js";
import { useAuthState } from "./state.js";

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
      // TODO: Should handle errors/state
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
      await authentication.signUp({
        redirectTo: window.location.href,
      });
    },
  };
};
