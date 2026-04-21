// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createStore } from "zustand";
import { setupCookieSync } from "./cookie-sync.js";
import type { UserProfile } from "./state.js";

// cookie-sync is intentionally provider-agnostic: it reads top-level
// access/refresh tokens off providerData. Use a loose shape so tests can
// exercise the contract without pulling in a specific provider's schema.
type LooseState = {
  isAuthenticated: boolean;
  profile: UserProfile | null;
  providerData: unknown;
};

const PROFILE: UserProfile = {
  sub: "u1",
  email: "u@example.com",
  emailVerified: true,
  name: "U",
  pictureUrl: undefined,
};

const createSlice = (initial: Partial<LooseState> = {}) =>
  createStore<LooseState>(() => ({
    isAuthenticated: false,
    profile: null,
    providerData: null,
    ...initial,
  }));

const setup = (store: ReturnType<typeof createSlice>) =>
  setupCookieSync(store as unknown as Parameters<typeof setupCookieSync>[0]);

describe("setupCookieSync", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    delete (window as { ZUDOKU_SSR_AUTH?: unknown }).ZUDOKU_SSR_AUTH;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("is a no-op on the server", () => {
    const original = globalThis.window;
    // @ts-expect-error simulate SSR
    delete globalThis.window;
    try {
      const store = createSlice();
      setup(store);
      store.setState({
        isAuthenticated: true,
        profile: PROFILE,
        providerData: { accessToken: "t" },
      });
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      globalThis.window = original;
    }
  });

  test("posts access + refresh tokens when login transitions false → true", async () => {
    const store = createSlice();
    setup(store);
    store.setState({
      isAuthenticated: true,
      profile: PROFILE,
      providerData: { accessToken: "atok", refreshToken: "rtok" },
    });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/__z/auth/session");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      accessToken: "atok",
      refreshToken: "rtok",
    });
  });

  test("re-posts when providerData changes while authenticated (token refresh)", async () => {
    const store = createSlice({
      isAuthenticated: true,
      profile: PROFILE,
      providerData: { accessToken: "first" },
    });
    (window as { ZUDOKU_SSR_AUTH?: unknown }).ZUDOKU_SSR_AUTH = {
      profile: PROFILE,
    };
    setup(store);
    expect(fetchMock).not.toHaveBeenCalled(); // SSR already had cookies

    store.setState({ providerData: { accessToken: "second" } });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body)).toEqual({
      accessToken: "second",
    });
  });

  test("skips initial post when SSR already hydrated the session", () => {
    (window as { ZUDOKU_SSR_AUTH?: unknown }).ZUDOKU_SSR_AUTH = {
      profile: PROFILE,
    };
    const store = createSlice({
      isAuthenticated: true,
      profile: PROFILE,
      providerData: { accessToken: "t" },
    });
    setup(store);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("posts on initial rehydrate when SSR did not see cookies", () => {
    const store = createSlice({
      isAuthenticated: true,
      profile: PROFILE,
      providerData: { accessToken: "t" },
    });
    setup(store);
    expect(fetchMock).toHaveBeenCalledWith(
      "/__z/auth/session",
      expect.objectContaining({ method: "POST" }),
    );
  });

  test("DELETEs on logout transition true → false", async () => {
    const store = createSlice({
      isAuthenticated: true,
      profile: PROFILE,
      providerData: { accessToken: "t" },
    });
    (window as { ZUDOKU_SSR_AUTH?: unknown }).ZUDOKU_SSR_AUTH = {
      profile: PROFILE,
    };
    setup(store);
    store.setState({
      isAuthenticated: false,
      profile: null,
      providerData: null,
    });
    await vi.waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/__z/auth/session",
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
  });

  test("no-ops when providerData has no access token", () => {
    const store = createSlice();
    setup(store);
    store.setState({
      isAuthenticated: true,
      profile: PROFILE,
      providerData: { foo: "bar" }, // no accessToken
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("treats 501 as a benign no-op (no error logged)", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 501 }));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const store = createSlice();
    setup(store);
    store.setState({
      isAuthenticated: true,
      profile: PROFILE,
      providerData: { accessToken: "t" },
    });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  test("logs an error for non-501 failures", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 502 }));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const store = createSlice();
    setup(store);
    store.setState({
      isAuthenticated: true,
      profile: PROFILE,
      providerData: { accessToken: "t" },
    });
    await vi.waitFor(() => expect(errSpy).toHaveBeenCalled());
    errSpy.mockRestore();
  });
});
