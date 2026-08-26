import { afterEach, describe, expect, test, vi } from "vitest";
import type { UserProfile } from "./state.js";
import {
  applyUserData,
  decodeTokenClaims,
  fetchUserData,
  selectClaims,
  UserDataError,
} from "./user-data.js";

const PROFILE: UserProfile = {
  sub: "user-1",
  email: "user@example.com",
  emailVerified: true,
  name: "Test User",
  pictureUrl: undefined,
};

const b64url = (value: object) =>
  Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const jwt = (payload: object) =>
  `${b64url({ alg: "none" })}.${b64url(payload)}.signature`;

const mockFetch = (impl: typeof fetch) =>
  vi.spyOn(globalThis, "fetch").mockImplementation(impl);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("selectClaims", () => {
  test("lifts a claim under its own name", () => {
    expect(
      selectClaims(
        ["https://zuplo.com/subscription"],
        [{ "https://zuplo.com/subscription": { plan: "pro" } }],
      ),
    ).toEqual({ "https://zuplo.com/subscription": { plan: "pro" } });
  });

  test("renames a claim via `as`", () => {
    expect(
      selectClaims(
        [{ claim: "https://zuplo.com/subscription", as: "subscription" }],
        [{ "https://zuplo.com/subscription": { plan: "pro" } }],
      ),
    ).toEqual({ subscription: { plan: "pro" } });
  });

  test("skips claims that no source carries", () => {
    expect(selectClaims(["missing"], [{ other: 1 }, undefined])).toEqual({});
  });

  test("first source carrying the claim wins", () => {
    expect(
      selectClaims(
        ["plan"],
        [undefined, { plan: "id-token" }, { plan: "access-token" }],
      ),
    ).toEqual({ plan: "id-token" });
  });

  test("keeps a claim that is explicitly null", () => {
    expect(selectClaims(["plan"], [{ plan: null }])).toEqual({ plan: null });
  });
});

describe("decodeTokenClaims", () => {
  test("decodes a JWT payload", async () => {
    await expect(
      decodeTokenClaims(jwt({ sub: "user-1", plan: "pro" })),
    ).resolves.toMatchObject({
      sub: "user-1",
      plan: "pro",
    });
  });

  test("returns undefined for a missing or unparseable token", async () => {
    await expect(decodeTokenClaims(undefined)).resolves.toBeUndefined();
    await expect(decodeTokenClaims("not-a-jwt")).resolves.toBeUndefined();
  });
});

describe("fetchUserData", () => {
  test("merges an object response at the top level", async () => {
    mockFetch(async () => Response.json({ plan: "pro", seats: 5 }));

    await expect(
      fetchUserData("https://api.example.com/me", "token-1"),
    ).resolves.toEqual({ plan: "pro", seats: 5 });
  });

  test("nests the response under `as`", async () => {
    mockFetch(async () => Response.json({ plan: "pro" }));

    await expect(
      fetchUserData(
        { url: "https://api.example.com/me", as: "subscription" },
        "token-1",
      ),
    ).resolves.toEqual({ subscription: { plan: "pro" } });
  });

  test("accepts a non-object response when nested under `as`", async () => {
    mockFetch(async () => Response.json("pro"));

    await expect(
      fetchUserData(
        { url: "https://api.example.com/me", as: "plan" },
        "token-1",
      ),
    ).resolves.toEqual({ plan: "pro" });
  });

  test("sends the access token as a bearer token", async () => {
    const fetchSpy = mockFetch(async () => Response.json({ plan: "pro" }));

    await fetchUserData(
      {
        url: "https://api.example.com/me",
        method: "POST",
        headers: { "x-portal": "docs" },
      },
      "token-1",
    );

    expect(fetchSpy).toHaveBeenCalledWith("https://api.example.com/me", {
      method: "POST",
      headers: {
        "x-portal": "docs",
        Accept: "application/json",
        Authorization: "Bearer token-1",
      },
    });
  });

  test("configured headers cannot override the bearer token", async () => {
    const fetchSpy = mockFetch(async () => Response.json({ plan: "pro" }));

    await fetchUserData(
      {
        url: "https://api.example.com/me",
        headers: { Authorization: "Bearer attacker" },
      },
      "token-1",
    );

    expect(fetchSpy.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer token-1",
    });
  });

  test("returns undefined and logs when the request fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch(async () => new Response(null, { status: 503 }));

    await expect(
      fetchUserData("https://api.example.com/me", "token-1"),
    ).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
  });

  test("returns undefined when a top-level response is not an object", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch(async () => Response.json(["pro"]));

    await expect(
      fetchUserData("https://api.example.com/me", "token-1"),
    ).resolves.toBeUndefined();
  });

  test("throws on failure when the endpoint is required", async () => {
    mockFetch(async () => new Response(null, { status: 503 }));

    await expect(
      fetchUserData(
        { url: "https://api.example.com/me", required: true },
        "token-1",
      ),
    ).rejects.toThrow(UserDataError);
  });

  test("wraps a network error when the endpoint is required", async () => {
    mockFetch(async () => {
      throw new TypeError("network down");
    });

    await expect(
      fetchUserData(
        { url: "https://api.example.com/me", required: true },
        "token-1",
      ),
    ).rejects.toThrow(UserDataError);
  });
});

describe("applyUserData", () => {
  test("returns the profile untouched without config", async () => {
    await expect(
      applyUserData(PROFILE, { userData: undefined, accessToken: "token-1" }),
    ).resolves.toBe(PROFILE);
  });

  test("combines claims and endpoint data", async () => {
    mockFetch(async () => Response.json({ plan: "pro" }));

    await expect(
      applyUserData(PROFILE, {
        userData: {
          claims: [{ claim: "https://zuplo.com/roles", as: "roles" }],
          endpoint: { url: "https://api.example.com/me", as: "subscription" },
        },
        accessToken: "token-1",
        claimSources: [{ "https://zuplo.com/roles": ["admin"] }],
      }),
    ).resolves.toMatchObject({
      sub: "user-1",
      roles: ["admin"],
      subscription: { plan: "pro" },
    });
  });

  test("endpoint data wins over a colliding claim", async () => {
    mockFetch(async () => Response.json({ plan: "endpoint" }));

    const profile = await applyUserData(PROFILE, {
      userData: {
        claims: [{ claim: "plan" }],
        endpoint: "https://api.example.com/me",
      },
      accessToken: "token-1",
      claimSources: [{ plan: "claim" }],
    });

    expect(profile.plan).toBe("endpoint");
  });

  test("never lets custom user data rewrite `sub`", async () => {
    mockFetch(async () => Response.json({ sub: "attacker", plan: "pro" }));

    const profile = await applyUserData(PROFILE, {
      userData: {
        claims: [{ claim: "sub" }],
        endpoint: "https://api.example.com/me",
      },
      accessToken: "token-1",
      claimSources: [{ sub: "also-attacker" }],
    });

    expect(profile.sub).toBe("user-1");
    expect(profile.plan).toBe("pro");
  });

  test("leaves the profile unchanged when a soft endpoint failure yields nothing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch(async () => new Response(null, { status: 500 }));

    await expect(
      applyUserData(PROFILE, {
        userData: { endpoint: "https://api.example.com/me" },
        accessToken: "token-1",
      }),
    ).resolves.toBe(PROFILE);
  });
});
