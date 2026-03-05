import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { syncZustandState } from "../util/syncZustandState.js";

/**
 * Registry interface for provider-specific data types.
 * Providers augment this via declaration merging:
 *
 * ```ts
 * declare module "../state.js" {
 *   interface ProviderDataRegistry {
 *     myProvider: MyProviderData;
 *   }
 * }
 * ```
 */
// biome-ignore lint/suspicious/noEmptyInterface: Intended to be augmented via declaration merging by auth providers
export interface ProviderDataRegistry {}

export type ProviderData = [keyof ProviderDataRegistry] extends [never]
  ? unknown
  : ProviderDataRegistry[keyof ProviderDataRegistry];

export interface AuthState {
  isAuthenticated: boolean;
  isPending: boolean;
  profile: UserProfile | null;
  providerData: ProviderData | null;
  setAuthenticationPending: () => void;
  setLoggedOut: () => void;
  setLoggedIn: (args: {
    profile: UserProfile;
    providerData: ProviderData;
  }) => void;
}

export const authState = create<AuthState>()(
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
      setLoggedIn: ({ profile, providerData }) =>
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

syncZustandState(authState);

export const useAuthState = authState;

export interface UserProfile {
  sub: string;
  email: string | undefined;
  emailVerified: boolean;
  name: string | undefined;
  pictureUrl: string | undefined;
  [key: string]: string | boolean | undefined;
}
