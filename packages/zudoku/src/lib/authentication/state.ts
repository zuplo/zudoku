import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { syncZustandState } from "../util/syncZustandState.js";

export interface AuthState<ProviderData = unknown> {
  isAuthenticated: boolean;
  isPending: boolean;
  profile: UserProfile | null;
  providerData: ProviderData | null;
  setAuthenticationPending: () => void;
  setLoggedOut: () => void;
  setLoggedIn: ({
    profile,
    providerData,
  }: {
    profile: UserProfile;
    providerData: unknown;
  }) => void;
}

export const useAuthState = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isPending: true,
      profile: null,
      providerData: null,
      setAuthenticationPending: () =>
        set(() => ({
          isAuthenticated: false,
          isPending: false,
          profile: null,
          providerData: null,
        })),
      setLoggedOut: () =>
        set(() => ({
          isAuthenticated: false,
          isPending: false,
          profile: null,
          providerData: null,
        })),
      setLoggedIn: ({
        profile,
        providerData,
      }: {
        profile: UserProfile;
        providerData: unknown;
      }) =>
        set(() => ({
          isAuthenticated: true,
          isPending: false,
          profile,
          providerData,
        })),
    }),
    {
      merge: (persistedState, currentState) => {
        return {
          ...currentState,
          isPending: false,
          ...(typeof persistedState === "object" ? persistedState : {}),
        };
      },
      name: "auth-state",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

syncZustandState(useAuthState);

export interface UserProfile {
  sub: string;
  email: string | undefined;
  emailVerified: boolean;
  name: string | undefined;
  pictureUrl: string | undefined;
  [key: string]: string | boolean | undefined;
}
