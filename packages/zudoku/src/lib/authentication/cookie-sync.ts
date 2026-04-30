import type { StoreApi } from "zustand";
import type { AuthState } from "./state.js";

type TokenBearer = { accessToken?: string; refreshToken?: string };

const readTokens = (providerData: unknown): TokenBearer => {
  if (!providerData || typeof providerData !== "object") return {};
  const data = providerData as Record<string, unknown>;
  return {
    accessToken:
      typeof data.accessToken === "string" ? data.accessToken : undefined,
    refreshToken:
      typeof data.refreshToken === "string" ? data.refreshToken : undefined,
  };
};

// In-flight controller so a later auth event can abort an earlier request.
// Without this, a logout can race a slow login and the late POST would
// re-establish the session after the user explicitly signed out.
let inflight: AbortController | undefined;

const send = (init: RequestInit) => {
  inflight?.abort();
  inflight = new AbortController();
  return fetch("/__z/auth/session", { ...init, signal: inflight.signal });
};

const postSession = async (providerData: unknown) => {
  const { accessToken, refreshToken } = readTokens(providerData);
  if (!accessToken) return;

  try {
    const r = await send({
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
    if ((e as Error)?.name === "AbortError") return;
    // biome-ignore lint/suspicious/noConsole: Surface SSR auth failures
    console.error("SSR auth cookie sync error:", e);
  }
};

const clearSession = async () => {
  try {
    await send({ method: "DELETE" });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return;
    // biome-ignore lint/suspicious/noConsole: Surface SSR auth failures
    console.error("SSR auth cookie clear failed:", e);
  }
};

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
