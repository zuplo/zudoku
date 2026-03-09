import type { StateCreator, StoreMutatorIdentifier } from "zustand";
import type { AuthState, UserProfile } from "./state.js";

type CookieSync = <
  T extends Pick<AuthState, "isAuthenticated" | "profile" | "providerData">,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  config: StateCreator<T, Mps, Mcs>,
) => StateCreator<T, Mps, Mcs>;

const cookieSyncImpl: CookieSync = (config) => (set, get, api) => {
  const result = config(set, get, api);

  if (typeof window !== "undefined") {
    // Subscribe for ongoing state changes (login/logout actions)
    api.subscribe((next, prev) => {
      if (next.isAuthenticated && next.profile) {
        if (!prev.isAuthenticated || next.providerData !== prev.providerData) {
          syncSessionCookie(next.profile, next.providerData);
        }
      } else if (!next.isAuthenticated && prev.isAuthenticated) {
        void fetch("/__z/auth/session", { method: "DELETE" }).catch((e) => {
          // biome-ignore lint/suspicious/noConsole: Log session clear failures
          console.warn("Failed to clear session cookie:", e);
        });
      }
    });

    // Sync immediately if persist already rehydrated an authenticated session
    // but SSR didn't have cookies yet (subscribe misses the initial rehydration)
    const state = api.getState();
    if (state.isAuthenticated && state.profile && !window.ZUDOKU_SSR_AUTH) {
      syncSessionCookie(state.profile, state.providerData);
    }
  }

  return result;
};

export const cookieSync = cookieSyncImpl as CookieSync;

const syncSessionCookie = (profile: UserProfile, providerData: unknown) => {
  const data = providerData as
    | { accessToken?: string; refreshToken?: string }
    | undefined;

  void fetch("/__z/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessToken: data?.accessToken,
      refreshToken: data?.refreshToken,
      profile,
    }),
  })
    .then((r) => {
      if (!r.ok) {
        // biome-ignore lint/suspicious/noConsole: Debug cookie sync
        console.warn("Cookie sync failed:", r.status);
      }
    })
    .catch((e) => {
      // biome-ignore lint/suspicious/noConsole: Debug cookie sync
      console.warn("Cookie sync error:", e);
    });
};
