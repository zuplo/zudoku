// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useAuthState } from "../state.js";
import firebaseAuth from "./firebase.js";

vi.hoisted(() => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      clear: vi.fn(),
      getItem: vi.fn(() => null),
      key: vi.fn(() => null),
      length: 0,
      removeItem: vi.fn(),
      setItem: vi.fn(),
    },
  });
});

const firebase = vi.hoisted(() => ({
  authStateReady: vi.fn<() => Promise<void>>(),
  auth: {
    currentUser: null as null | {
      uid: string;
      email: string | null;
      displayName: string | null;
      emailVerified: boolean;
      photoURL: string | null;
      getIdToken: ReturnType<typeof vi.fn>;
    },
  },
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({
    ...firebase.auth,
    authStateReady: firebase.authStateReady,
    get currentUser() {
      return firebase.auth.currentUser;
    },
  })),
}));

const config = {
  type: "firebase" as const,
  apiKey: "api-key",
  authDomain: "example.firebaseapp.com",
  projectId: "example",
  appId: "app-id",
};

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

describe("firebase initial auth restoration", () => {
  beforeEach(() => {
    firebase.auth.currentUser = null;
    firebase.authStateReady.mockReset();
    delete window.ZUDOKU_SSR_AUTH;
    useAuthState.getState().setLoggedOut();
  });

  afterEach(() => {
    delete window.ZUDOKU_SSR_AUTH;
  });

  test("restores a persisted user without exposing a blocking initializer", async () => {
    const ready = deferred();
    firebase.authStateReady.mockReturnValue(ready.promise);

    const provider = firebaseAuth(config);

    expect(provider.initialize).toBeUndefined();
    expect(useAuthState.getState().isPending).toBe(true);

    firebase.auth.currentUser = {
      uid: "user-1",
      email: "user@example.com",
      displayName: "Test User",
      emailVerified: true,
      photoURL: "https://example.com/avatar.png",
      getIdToken: vi.fn().mockResolvedValue("token"),
    };
    ready.resolve();

    await vi.waitFor(() => {
      expect(useAuthState.getState()).toMatchObject({
        isAuthenticated: true,
        isPending: false,
        profile: {
          sub: "user-1",
          email: "user@example.com",
          name: "Test User",
        },
      });
    });
  });

  test("reconciles Firebase readiness without replacing authoritative SSR auth", async () => {
    const profile = {
      sub: "server-user",
      email: "server@example.com",
      name: "Server User",
      emailVerified: true,
      pictureUrl: undefined,
    };
    window.ZUDOKU_SSR_AUTH = { profile };
    useAuthState.setState({
      isAuthenticated: true,
      isPending: false,
      profile,
      providerData: null,
    });

    firebase.authStateReady.mockResolvedValue();
    firebaseAuth(config);

    expect(firebase.authStateReady).toHaveBeenCalledOnce();
    await vi.waitFor(() =>
      expect(useAuthState.getState().isPending).toBe(false),
    );
    expect(useAuthState.getState()).toMatchObject({
      isAuthenticated: true,
      isPending: false,
      profile,
    });
  });

  test("clears an unverified persisted profile while restoration is pending", () => {
    const ready = deferred();
    firebase.authStateReady.mockReturnValue(ready.promise);
    useAuthState.setState({
      isAuthenticated: true,
      isPending: false,
      profile: {
        sub: "stale-user",
        email: "stale@example.com",
        name: "Stale User",
        emailVerified: true,
        pictureUrl: undefined,
      },
      providerData: null,
    });

    firebaseAuth(config);

    expect(useAuthState.getState()).toMatchObject({
      isAuthenticated: false,
      isPending: true,
      profile: null,
      providerData: null,
    });
  });

  test("signRequest waits for initial auth restoration", async () => {
    const ready = deferred();
    firebase.authStateReady.mockReturnValue(ready.promise);
    const provider = firebaseAuth(config);
    const request = new Request("https://example.com/api");
    let settled = false;
    const signedRequest = provider.signRequest(request).finally(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    firebase.auth.currentUser = {
      uid: "user-1",
      email: "user@example.com",
      displayName: "Test User",
      emailVerified: true,
      photoURL: null,
      getIdToken: vi.fn().mockResolvedValue("firebase-token"),
    };
    ready.resolve();

    await expect(signedRequest).resolves.toBe(request);
    expect(request.headers.get("Authorization")).toBe("Bearer firebase-token");
  });
});
