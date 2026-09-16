// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useAuthState } from "../state.js";
import clerkAuth from "./clerk.js";

const TEST_PUB_KEY = "pk_test_Y2xlcmsuZXhhbXBsZS5jb20k" as const;

vi.hoisted(() => {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
});

describe("clerkAuth signUp short-circuit", () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    localStorage.clear();
    document.head.innerHTML = "";
    delete (window as { Clerk?: unknown }).Clerk;
    delete window.ZUDOKU_SSR_AUTH;
    useAuthState.getState().setLoggedOut();
    for (const name of [
      "__session",
      "__client_uat",
      "__clerk_db_jwt",
      "__clerk_handshake",
    ]) {
      // biome-ignore lint/suspicious/noDocumentCookie: Clerk session hints are cookies in production
      document.cookie = `${name}=; Max-Age=0; Path=/`;
    }
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
    document.head.innerHTML = "";
    delete window.ZUDOKU_SSR_AUTH;
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("initialize defers the Clerk SDK for a fresh anonymous SSG page", async () => {
    vi.useFakeTimers();
    const provider = clerkAuth({
      type: "clerk",
      clerkPubKey: TEST_PUB_KEY,
      jwtTemplateName: "dev-portal",
    });

    await provider.initialize?.({} as never);

    expect(document.head.querySelector("script")).toBeNull();
    expect(vi.getTimerCount()).toBe(1);
    expect(useAuthState.getState()).toMatchObject({
      isAuthenticated: false,
      isPending: false,
    });
  });

  test("initialize preserves an authoritative SSR profile without loading Clerk", async () => {
    vi.useFakeTimers();
    const profile = {
      sub: "user-1",
      email: "user@example.com",
      emailVerified: true,
      name: "User",
      pictureUrl: undefined,
    };
    useAuthState.getState().setLoggedIn({
      profile,
      providerData: { type: "clerk", user: undefined },
    });
    window.ZUDOKU_SSR_AUTH = { profile };
    const provider = clerkAuth({
      type: "clerk",
      clerkPubKey: TEST_PUB_KEY,
      jwtTemplateName: "dev-portal",
    });

    await provider.initialize?.({} as never);

    expect(document.head.querySelector("script")).toBeNull();
    expect(useAuthState.getState()).toMatchObject({
      isAuthenticated: true,
      isPending: false,
      profile,
    });
    expect(vi.getTimerCount()).toBe(1);
  });

  test("initialize restores a persisted SSG profile even without a cookie hint", async () => {
    let script: HTMLScriptElement | undefined;
    const appendChild = vi
      .spyOn(document.head, "appendChild")
      .mockImplementation((node) => {
        script = node as HTMLScriptElement;
        return node;
      });
    const profile = {
      sub: "user-1",
      email: "user@example.com",
      emailVerified: true,
      name: "User",
      pictureUrl: undefined,
    };
    useAuthState.getState().setLoggedIn({
      profile,
      providerData: { type: "clerk", user: undefined },
    });
    const provider = clerkAuth({
      type: "clerk",
      clerkPubKey: TEST_PUB_KEY,
      jwtTemplateName: "dev-portal",
    });

    await provider.initialize?.({} as never);

    expect(appendChild).toHaveBeenCalledWith(expect.any(HTMLScriptElement));
    expect(useAuthState.getState()).toMatchObject({
      isAuthenticated: false,
      isPending: true,
      profile: null,
    });

    script?.onerror?.(new Event("error"));
    await vi.waitFor(() =>
      expect(useAuthState.getState().isPending).toBe(false),
    );
  });

  test("profile refresh preserves the anonymous fast path", async () => {
    vi.useFakeTimers();
    const provider = clerkAuth({
      type: "clerk",
      clerkPubKey: TEST_PUB_KEY,
      jwtTemplateName: "dev-portal",
    });

    await provider.initialize?.({} as never);
    await expect(provider.refreshUserProfile?.()).resolves.toBe(false);

    expect(document.head.querySelector("script")).toBeNull();
  });

  test("a failed returning-session load resolves logged out and can retry", async () => {
    const appendChild = vi
      .spyOn(document.head, "appendChild")
      .mockImplementation((node) => {
        queueMicrotask(() =>
          (node as HTMLScriptElement).onerror?.(new Event("error")),
        );
        return node;
      });
    const profile = {
      sub: "user-1",
      email: "user@example.com",
      emailVerified: true,
      name: "User",
      pictureUrl: undefined,
    };
    useAuthState.getState().setLoggedIn({
      profile,
      providerData: { type: "clerk", user: undefined },
    });
    const provider = clerkAuth({
      type: "clerk",
      clerkPubKey: TEST_PUB_KEY,
      jwtTemplateName: "dev-portal",
    });

    await provider.initialize?.({} as never);
    await vi.waitFor(() => {
      expect(useAuthState.getState()).toMatchObject({
        isAuthenticated: false,
        isPending: false,
        profile: null,
      });
    });

    const attemptsAfterInitialization = appendChild.mock.calls.length;
    void provider.signIn({ navigate: vi.fn() }).catch(() => {});
    await vi.waitFor(() => {
      expect(appendChild.mock.calls.length).toBeGreaterThan(
        attemptsAfterInitialization,
      );
    });
  });

  test("signUp({ url }) skips Clerk SDK and uses location.assign for absolute URL", async () => {
    const loc = { assign: vi.fn(), replace: vi.fn() };
    Object.defineProperty(window, "location", {
      configurable: true,
      value: loc,
    });

    const provider = clerkAuth({
      type: "clerk",
      // Format only matters for the Zod validator; provider does not parse it
      // unless loadClerk runs. The short-circuit must prevent that.
      clerkPubKey: TEST_PUB_KEY,
      jwtTemplateName: "dev-portal",
      signUp: { url: "https://app.example.com/register" },
    });

    await provider.signUp({ navigate: vi.fn() }, {});

    expect(loc.assign).toHaveBeenCalledWith("https://app.example.com/register");
    // No Clerk script should have been injected
    expect(document.head.querySelector("script")).toBeNull();
  });

  test("signUp({ url }) with relative path uses navigate, no SDK load", async () => {
    const navigate = vi.fn();

    const provider = clerkAuth({
      type: "clerk",
      clerkPubKey: TEST_PUB_KEY,
      jwtTemplateName: "dev-portal",
      signUp: { url: "/register" },
    });

    await provider.signUp({ navigate }, {});

    expect(navigate).toHaveBeenCalledWith("/register", { replace: false });
    expect(document.head.querySelector("script")).toBeNull();
  });

  test("initialize starts Clerk in the background when a session hint is present", async () => {
    let script: HTMLScriptElement | undefined;
    const appendChild = vi
      .spyOn(document.head, "appendChild")
      .mockImplementation((node) => {
        script = node as HTMLScriptElement;
        return node;
      });
    // biome-ignore lint/suspicious/noDocumentCookie: Clerk session hints are cookies in production
    document.cookie = "__session=session-token; Path=/";
    const provider = clerkAuth({
      type: "clerk",
      clerkPubKey: TEST_PUB_KEY,
      jwtTemplateName: "dev-portal",
    });

    await provider.initialize?.({} as never);

    expect(appendChild).toHaveBeenCalledWith(expect.any(HTMLScriptElement));
    script?.onerror?.(new Event("error"));
    await vi.waitFor(() =>
      expect(useAuthState.getState().isPending).toBe(false),
    );
  });

  test("profile refresh works after deferred Clerk initialization", async () => {
    const profile = {
      sub: "user-1",
      email: "user@example.com",
      emailVerified: true,
      name: "User",
      pictureUrl: undefined,
    };
    const reload = vi.fn().mockResolvedValue(undefined);
    const clerk = {
      load: vi.fn().mockResolvedValue(undefined),
      session: {
        getToken: vi.fn().mockResolvedValue("access-token"),
        user: {
          id: profile.sub,
          fullName: profile.name,
          imageUrl: profile.pictureUrl,
          reload,
          emailAddresses: [
            {
              emailAddress: profile.email,
              verification: { status: "verified" },
            },
          ],
        },
      },
    };
    Object.defineProperty(window, "Clerk", {
      configurable: true,
      value: clerk,
    });
    vi.spyOn(document.head, "appendChild").mockImplementation((node) => {
      queueMicrotask(() =>
        (node as HTMLScriptElement).onload?.(new Event("load")),
      );
      return node;
    });
    window.ZUDOKU_SSR_AUTH = { profile };
    useAuthState.getState().setLoggedIn({
      profile,
      providerData: { type: "clerk", user: undefined },
    });
    const provider = clerkAuth({
      type: "clerk",
      clerkPubKey: TEST_PUB_KEY,
      jwtTemplateName: "dev-portal",
    });

    await provider.initialize?.({} as never);
    window.dispatchEvent(new Event("pointerdown"));
    await vi.waitFor(() => expect(clerk.load).toHaveBeenCalledOnce());

    await expect(provider.refreshUserProfile?.()).resolves.toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });
});
