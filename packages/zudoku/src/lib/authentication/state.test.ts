// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { UserProfile } from "./state.js";

const STORAGE_KEY = "auth-state";

const PROFILE: UserProfile = {
  sub: "u1",
  email: "u@example.com",
  emailVerified: true,
  name: "U",
  pictureUrl: undefined,
};

const loadState = async () => {
  vi.resetModules();
  const mod = await import("./state.js");
  return mod.authState;
};

describe("authState — SSG (ZUDOKU_HAS_SERVER unset)", () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as { ZUDOKU_SSR_AUTH?: unknown }).ZUDOKU_SSR_AUTH;
  });

  test("persists login to localStorage so refresh keeps the session", async () => {
    const store = await loadState();
    store.getState().setLoggedIn({ profile: PROFILE, providerData: null });

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    expect(persisted?.state?.isAuthenticated).toBe(true);
    expect(persisted?.state?.profile?.sub).toBe("u1");
  });

  test("rehydrates a persisted session on next load", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          isAuthenticated: true,
          isPending: false,
          profile: PROFILE,
          providerData: null,
        },
        version: 0,
      }),
    );

    const store = await loadState();
    expect(store.getState().isAuthenticated).toBe(true);
    expect(store.getState().profile?.sub).toBe("u1");
  });

  test("ignores a stale ZUDOKU_SSR_AUTH signal — localStorage still wins", async () => {
    // Prerendered HTML from an older build may still carry this script;
    // SSG must not flip into cookie-as-source-of-truth mode.
    (window as { ZUDOKU_SSR_AUTH?: unknown }).ZUDOKU_SSR_AUTH = {
      profile: null,
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          isAuthenticated: true,
          isPending: false,
          profile: PROFILE,
          providerData: null,
        },
        version: 0,
      }),
    );

    const store = await loadState();
    expect(store.getState().isAuthenticated).toBe(true);
  });
});

describe("authState — SSR (ZUDOKU_HAS_SERVER=true)", () => {
  beforeEach(() => {
    localStorage.clear();
    delete (window as { ZUDOKU_SSR_AUTH?: unknown }).ZUDOKU_SSR_AUTH;
    vi.stubEnv("ZUDOKU_HAS_SERVER", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("does not write to localStorage; cookies are the source of truth", async () => {
    const store = await loadState();
    store.getState().setLoggedIn({ profile: PROFILE, providerData: null });

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
