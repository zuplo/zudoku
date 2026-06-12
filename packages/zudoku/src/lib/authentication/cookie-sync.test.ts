// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createStore } from "zustand";
import {
  fetchServerSession,
  setupCookieSync,
  waitForSessionSync,
} from "./cookie-sync.js";
import type { UserProfile } from "./state.js";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

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

const ENDPOINT = "/docs/__z/auth/session";

const setup = (store: ReturnType<typeof createSlice>) =>
  setupCookieSync(
    store as unknown as Parameters<typeof setupCookieSync>[0],
    ENDPOINT,
  );

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
    expect(url).toBe(ENDPOINT);
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
      ENDPOINT,
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
        ENDPOINT,
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

  test("waitForSessionSync resolves only after the in-flight POST settles", async () => {
    let resolveFetch: (r: Response) => void = () => {};
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const store = createSlice();
    setup(store);
    store.setState({
      isAuthenticated: true,
      profile: PROFILE,
      providerData: { accessToken: "t" },
    });

    let settled = false;
    const wait = waitForSessionSync().then(() => {
      settled = true;
    });
    await flush();
    expect(settled).toBe(false); // POST still in flight

    resolveFetch(new Response(null, { status: 200 }));
    await wait;
    expect(settled).toBe(true);
  });

  test("waitForSessionSync resolves (never rejects) when the sync fails", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 502 }));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const store = createSlice();
    setup(store);
    store.setState({
      isAuthenticated: true,
      profile: PROFILE,
      providerData: { accessToken: "t" },
    });

    await expect(waitForSessionSync()).resolves.toBeUndefined();
    errSpy.mockRestore();
  });

  test("waitForSessionSync awaits a superseding sync, not the superseded one", async () => {
    const resolvers: Array<(r: Response) => void> = [];
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolvers.push(resolve);
        }),
    );
    const store = createSlice();
    setup(store);
    store.setState({
      isAuthenticated: true,
      profile: PROFILE,
      providerData: { accessToken: "a" },
    });

    let settled = false;
    const wait = waitForSessionSync().then(() => {
      settled = true;
    });

    // A token refresh supersedes the first POST before it settles.
    store.setState({ providerData: { accessToken: "b" } });
    await flush();

    // Settling only the first (superseded) POST must NOT open the gate.
    resolvers[0]?.(new Response(null, { status: 200 }));
    await flush();
    expect(settled).toBe(false);

    // Settling the superseding POST does.
    resolvers[1]?.(new Response(null, { status: 200 }));
    await wait;
    expect(settled).toBe(true);
  });

  test("waitForSessionSync tracks the DELETE on logout", async () => {
    let resolveFetch: (r: Response) => void = () => {};
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
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

    let settled = false;
    const wait = waitForSessionSync().then(() => {
      settled = true;
    });
    await flush();
    expect(settled).toBe(false); // DELETE still in flight

    resolveFetch(new Response(null, { status: 200 }));
    await wait;
    expect(settled).toBe(true);
  });
});

describe("fetchServerSession", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("returns the session on 200", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ accessToken: "tok", expiresAt: 123 }),
    );
    await expect(fetchServerSession(ENDPOINT)).resolves.toEqual({
      accessToken: "tok",
      expiresAt: 123,
    });
    expect(fetchMock).toHaveBeenCalledWith(ENDPOINT);
  });

  test("handles absent expiresAt", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ accessToken: "tok" }));
    await expect(fetchServerSession(ENDPOINT)).resolves.toEqual({
      accessToken: "tok",
    });
  });

  test("returns undefined on 401 (no session)", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    await expect(fetchServerSession(ENDPOINT)).resolves.toBeUndefined();
  });

  test("returns undefined on 501 (provider opted out)", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 501 }));
    await expect(fetchServerSession(ENDPOINT)).resolves.toBeUndefined();
  });

  test("throws on malformed 200 so it isn't treated as logout", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ unexpected: true }));
    await expect(fetchServerSession(ENDPOINT)).rejects.toThrow("malformed");
  });

  test("does not POST a token that was just restored from the server", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ accessToken: "restored-token" }),
    );
    await fetchServerSession(ENDPOINT);

    const store = createSlice({ isAuthenticated: true, profile: PROFILE });
    setup(store);
    store.setState({ providerData: { accessToken: "restored-token" } });
    await flush();

    // Only the session GET above; no cookie-sync POST for the same token.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("throws on transient failures so they aren't treated as logout", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 502 }));
    await expect(fetchServerSession(ENDPOINT)).rejects.toThrow("502");

    fetchMock.mockRejectedValueOnce(new TypeError("network down"));
    await expect(fetchServerSession(ENDPOINT)).rejects.toThrow("network down");
  });
});
