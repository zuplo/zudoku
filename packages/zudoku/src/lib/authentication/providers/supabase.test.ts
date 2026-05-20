// @vitest-environment happy-dom
import { afterEach, describe, expect, test, vi } from "vitest";
import supabaseAuth from "./supabase.js";

const getUser = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      onAuthStateChange: () => undefined,
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      getUser: (token: string) => getUser(token),
    },
  }),
}));

const buildProvider = () =>
  supabaseAuth({
    type: "supabase",
    supabaseUrl: "https://example.supabase.co",
    supabaseKey: "anon",
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
