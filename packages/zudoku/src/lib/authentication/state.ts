import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistOptions,
  type StateStorage,
} from "zustand/middleware";
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

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// Seed from the SSR-injected signal. Object present = server checked;
// `profile: null` = authoritative anon. Absent = fall back to pending.
const ssrAuthInitial =
  typeof window !== "undefined" ? window.ZUDOKU_SSR_AUTH : undefined;

// When a runtime server is available (dev, SSR deployments), tokens live
// only in httpOnly cookies the server writes after verification. Strip
// `providerData` from the persisted snapshot so access/refresh tokens the
// provider SDK happens to stash there never hit localStorage. Provider SDKs
// rehydrate their own session on boot and push a fresh `providerData` back
// into the store, which `cookie-sync` then mirrors to the server cookie.
//
// In SSG builds there is no server at runtime and therefore no cookie
// fallback — persist the full snapshot so a reload can still recover the
// session from localStorage.
const partialize: PersistOptions<AuthState>["partialize"] = import.meta.env
  .ZUDOKU_HAS_SERVER
  ? (state) =>
      ({
        isAuthenticated: state.isAuthenticated,
        profile: state.profile,
      }) as unknown as AuthState
  : (state) => state;

export const authState = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: !!ssrAuthInitial?.profile,
      isPending: ssrAuthInitial === undefined,
      profile: ssrAuthInitial?.profile ?? null,
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
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage,
      ),
      partialize,
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
