import { useNavigate } from "react-router";
import { useZudoku } from "../components/context/ZudokuContext.js";
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

    login: async () => {
      if (!isAuthEnabled) {
        throw new Error("Authentication is not enabled.");
      }
      // TODO: Should handle errors/state
      await authentication.signIn(
        { navigate },
        {
          redirectTo: window.location.href,
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
      window.location.href = "/";
    },

    signup: async () => {
      if (!isAuthEnabled) {
        throw new Error("Authentication is not enabled.");
      }
      await authentication.signUp(
        { navigate },
        {
          redirectTo: window.location.href,
        },
      );
    },
  };
};
