import { z } from "zod/mini";
import type { StoreApi } from "zustand";
import type { AuthState } from "./state.js";

const TokenBearerSchema = z.object({
  accessToken: z.optional(z.string()),
  refreshToken: z.optional(z.string()),
});

const ServerSessionSchema = z.object({
  accessToken: z.string(),
  expiresAt: z.optional(z.number()),
});

// Latest in-flight cookie sync, so a post-login redirect can await the cookie
// write before navigating. Resolved by default. See redirectAfterAuth.
let pendingSessionSync: Promise<unknown> = Promise.resolve();

// Cap a single sync so a stalled endpoint can't make waitForSessionSync hang.
const SESSION_SYNC_TIMEOUT_MS = 10_000;

// Resolve once the sync settles and none newer started meanwhile (a refresh can
// supersede a login's POST mid-flight). Never rejects.
export const waitForSessionSync = async (): Promise<void> => {
  let awaited: Promise<unknown>;
  do {
    awaited = pendingSessionSync;
    await awaited;
  } while (awaited !== pendingSessionSync);
};

// Access token the server itself just handed out via fetchServerSession.
// POSTing it back would only re-set the cookie it came from, so the cookie
// sync below skips it.
let serverProvidedAccessToken: string | undefined;

// Fetch the access token from the SSR session cookie. Returns undefined if no
// valid session exists (401/501). Transient failures throw.
export const fetchServerSession = async (sessionEndpoint: string) => {
  const response = await fetch(sessionEndpoint);
  if (response.status === 401 || response.status === 501) return;

  if (!response.ok) {
    throw new Error(`Session request failed with status ${response.status}`);
  }

  const parsed = ServerSessionSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("Session response is malformed");
  }

  serverProvidedAccessToken = parsed.data.accessToken;
  return parsed.data;
};

const readTokens = (providerData: unknown) =>
  TokenBearerSchema.safeParse(providerData).data ?? {};

// Mirror client auth state to SSR cookies so the next HTML render is authed
// on first paint. Reads tokens off providerData. No-op on the server.
export const setupCookieSync = (
  store: StoreApi<
    Pick<AuthState, "isAuthenticated" | "profile" | "providerData">
  >,
  sessionEndpoint: string,
) => {
  if (typeof window === "undefined") return;

  // Abort earlier requests to prevent logout racing with slow login.
  let inflight: AbortController | undefined;

  const send = async (init: RequestInit) => {
    inflight?.abort();
    const controller = new AbortController();
    inflight = controller;
    const timeout = setTimeout(
      () => controller.abort(),
      SESSION_SYNC_TIMEOUT_MS,
    );

    try {
      return await fetch(sessionEndpoint, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  const postSession = async (providerData: unknown) => {
    const { accessToken, refreshToken } = readTokens(providerData);
    if (!accessToken || accessToken === serverProvidedAccessToken) return;

    try {
      const response = await send({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, refreshToken }),
      });
      // 501 = provider opted out of SSR auth; any other failure is surfaced.
      if (!response.ok && response.status !== 501) {
        // biome-ignore lint/suspicious/noConsole: Surface SSR auth failures
        console.error("SSR auth cookie sync failed:", response.status);
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

  store.subscribe((next, prev) => {
    if (next.isAuthenticated && next.profile) {
      // Compare tokens, not object identity: Supabase sets state both directly
      // and via its listener with fresh objects but identical tokens.
      const a = readTokens(next.providerData);
      const b = readTokens(prev.providerData);
      if (
        !prev.isAuthenticated ||
        a.accessToken !== b.accessToken ||
        a.refreshToken !== b.refreshToken
      ) {
        pendingSessionSync = postSession(next.providerData);
      }
    } else if (!next.isAuthenticated && prev.isAuthenticated) {
      pendingSessionSync = clearSession();
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
    pendingSessionSync = postSession(state.providerData);
  }
};
