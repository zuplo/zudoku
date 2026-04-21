import type { StoreApi } from "zustand";
import type { AuthState } from "./state.js";

type TokenBearer = { accessToken?: string; refreshToken?: string };

const readTokens = (providerData: unknown): TokenBearer => {
  if (!providerData || typeof providerData !== "object") return {};
  const { accessToken, refreshToken } = providerData as TokenBearer;
  return {
    accessToken: typeof accessToken === "string" ? accessToken : undefined,
    refreshToken: typeof refreshToken === "string" ? refreshToken : undefined,
  };
};

const postSession = async (providerData: unknown) => {
  const { accessToken, refreshToken } = readTokens(providerData);
  if (!accessToken) return;

  try {
    const r = await fetch("/__z/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, refreshToken }),
    });
    // 501 = provider opted out of SSR auth; any other failure is surfaced.
    if (!r.ok && r.status !== 501) {
      // biome-ignore lint/suspicious/noConsole: Surface SSR auth failures
      console.error("SSR auth cookie sync failed:", r.status);
    }
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: Surface SSR auth failures
    console.error("SSR auth cookie sync error:", e);
  }
};

const clearSession = () =>
  fetch("/__z/auth/session", { method: "DELETE" }).catch((e) => {
    // biome-ignore lint/suspicious/noConsole: Surface SSR auth failures
    console.error("SSR auth cookie clear failed:", e);
  });

/**
 * Mirror the client auth state to SSR cookies so the next HTML render is
 * authenticated on first paint. Reads tokens from `providerData` — each
 * built-in provider puts them there. No-op on the server.
 */
export const setupCookieSync = (
  store: StoreApi<
    Pick<AuthState, "isAuthenticated" | "profile" | "providerData">
  >,
) => {
  if (typeof window === "undefined") return;

  store.subscribe((next, prev) => {
    if (next.isAuthenticated && next.profile) {
      if (!prev.isAuthenticated || next.providerData !== prev.providerData) {
        void postSession(next.providerData);
      }
    } else if (!next.isAuthenticated && prev.isAuthenticated) {
      void clearSession();
    }
  });

  // If persist rehydrated an authed session that SSR didn't see, push tokens
  // up so the next navigation is server-authed.
  const state = store.getState();
  if (
    state.isAuthenticated &&
    state.profile &&
    !window.ZUDOKU_SSR_AUTH?.profile
  ) {
    void postSession(state.providerData);
  }
};
