// @vitest-environment happy-dom
import { isValidElement } from "react";
import type { NavigateFunction } from "react-router";
import { afterEach, describe, expect, test, vi } from "vitest";
import { isNavigationPlugin } from "../../core/plugins.js";
import supabaseAuth from "./supabase.js";

const getUser = vi.fn();
const signInWithOAuth = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      onAuthStateChange: () => undefined,
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      getUser: (token: string) => getUser(token),
      signInWithOAuth: (args: unknown) => signInWithOAuth(args),
    },
  }),
}));

const buildProvider = (
  options: {
    redirectToAfterSignIn?: string;
    redirectToAfterSignUp?: string;
  } = {},
) =>
  supabaseAuth({
    type: "supabase",
    supabaseUrl: "https://example.supabase.co",
    supabaseKey: "anon",
    ...options,
  });

describe("supabase verifyAccessToken", () => {
  afterEach(() => vi.clearAllMocks());

  test("returns profile from verified user", async () => {
    getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: "u1",
          email: "u@example.com",
          email_confirmed_at: "2024-01-01T00:00:00Z",
          user_metadata: {
            full_name: "Full Name",
            avatar_url: "https://example.com/a.png",
          },
        },
      },
      error: null,
    });
    const provider = buildProvider();
    const result = await provider.verifyAccessToken?.("token");
    expect(result).toEqual({
      profile: {
        sub: "u1",
        email: "u@example.com",
        name: "Full Name",
        emailVerified: true,
        pictureUrl: "https://example.com/a.png",
      },
    });
    expect(getUser).toHaveBeenCalledWith("token");
  });

  test("returns null on error response", async () => {
    getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "invalid" },
    });
    const provider = buildProvider();
    expect(await provider.verifyAccessToken?.("token")).toBeUndefined();
  });

  test("propagates transport errors (→ 502 at the handler)", async () => {
    getUser.mockRejectedValueOnce(new Error("network"));
    const provider = buildProvider();
    await expect(provider.verifyAccessToken?.("token")).rejects.toThrow(
      "network",
    );
  });

  test("emailVerified is false when email_confirmed_at is null", async () => {
    getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: "u1",
          email: "u@example.com",
          email_confirmed_at: null,
          user_metadata: {},
        },
      },
      error: null,
    });
    const provider = buildProvider();
    const result = await provider.verifyAccessToken?.("token");
    expect(result?.profile.emailVerified).toBe(false);
  });
});

type OAuthProps = {
  onOAuthSignIn?: (providerId: string) => Promise<void>;
  onOAuthSignUp?: (providerId: string) => Promise<void>;
};

const getOAuthHandler = (
  provider: ReturnType<typeof buildProvider>,
  path: "/signin" | "/signup",
) => {
  if (!isNavigationPlugin(provider)) throw new Error("No routes");
  const element = provider.getRoutes().find((r) => r.path === path)?.element;
  if (!isValidElement<OAuthProps>(element)) throw new Error("No element");
  const handler =
    path === "/signin"
      ? element.props.onOAuthSignIn
      : element.props.onOAuthSignUp;
  if (!handler) throw new Error("No OAuth handler");
  return handler;
};

const oauthRedirectTo = () =>
  signInWithOAuth.mock.calls[0]?.[0]?.options?.redirectTo;

describe("supabase sign-in redirects", () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/");
  });

  test("signIn keeps the dynamic redirectTo", async () => {
    const navigate: NavigateFunction = vi.fn();
    await buildProvider().signIn({ navigate }, { redirectTo: "/protected" });
    expect(navigate).toHaveBeenCalledWith("/signin?redirectTo=%2Fprotected");
  });

  test("redirectToAfterSignIn takes precedence over redirectTo", async () => {
    const navigate: NavigateFunction = vi.fn();
    await buildProvider({ redirectToAfterSignIn: "/dashboard" }).signIn(
      { navigate },
      { redirectTo: "/protected" },
    );
    expect(navigate).toHaveBeenCalledWith("/signin?redirectTo=%2Fdashboard");
  });

  test("OAuth returns to the page the user tried to open", async () => {
    signInWithOAuth.mockResolvedValueOnce({ error: null });
    window.history.replaceState(
      {},
      "",
      `/signin?redirectTo=${encodeURIComponent("/protected?tab=1")}`,
    );
    await getOAuthHandler(buildProvider(), "/signin")("github");
    expect(oauthRedirectTo()).toBe(`${window.location.origin}/protected?tab=1`);
  });

  test("OAuth uses redirectToAfterSignIn when configured", async () => {
    signInWithOAuth.mockResolvedValueOnce({ error: null });
    window.history.replaceState({}, "", "/signin?redirectTo=%2Fprotected");
    const provider = buildProvider({ redirectToAfterSignIn: "/dashboard" });
    await getOAuthHandler(provider, "/signin")("github");
    expect(oauthRedirectTo()).toBe(`${window.location.origin}/dashboard`);
  });

  test("OAuth sign-up uses redirectToAfterSignUp when configured", async () => {
    signInWithOAuth.mockResolvedValueOnce({ error: null });
    const provider = buildProvider({
      redirectToAfterSignIn: "/dashboard",
      redirectToAfterSignUp: "/welcome",
    });
    await getOAuthHandler(provider, "/signup")("github");
    expect(oauthRedirectTo()).toBe(`${window.location.origin}/welcome`);
  });

  test("OAuth ignores a cross-origin redirectTo", async () => {
    signInWithOAuth.mockResolvedValueOnce({ error: null });
    window.history.replaceState(
      {},
      "",
      `/signin?redirectTo=${encodeURIComponent("https://evil.example/x")}`,
    );
    await getOAuthHandler(buildProvider(), "/signin")("github");
    expect(new URL(oauthRedirectTo()).origin).toBe(window.location.origin);
  });

  test("OAuth falls back to the site root without redirectTo", async () => {
    signInWithOAuth.mockResolvedValueOnce({ error: null });
    window.history.replaceState({}, "", "/signin");
    await getOAuthHandler(buildProvider(), "/signin")("github");
    expect(new URL(oauthRedirectTo()).pathname).toBe("/");
  });
});
