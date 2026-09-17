import { describe, expect, test, vi } from "vitest";
import { buildProfileFromClaims } from "./claims.js";

const CORE = {
  sub: "user-1",
  email: "user@example.com",
  name: "User",
  emailVerified: true,
  pictureUrl: "https://example.com/p.png",
};

describe("buildProfileFromClaims", () => {
  test("merges custom claims from all sources", () => {
    const profile = buildProfileFromClaims(
      [{ plan: "pro" }, { seats: 5 }],
      CORE,
    );

    expect(profile).toMatchObject({ plan: "pro", seats: 5, sub: "user-1" });
  });

  test("later sources win over earlier ones", () => {
    const profile = buildProfileFromClaims(
      [{ plan: "free" }, { plan: "pro" }],
      CORE,
    );

    expect(profile.plan).toBe("pro");
  });

  test("core identity fields cannot be overwritten by claims", () => {
    const profile = buildProfileFromClaims(
      [
        {
          sub: "attacker",
          email: "attacker@example.com",
          emailVerified: false,
          name: "Attacker",
          pictureUrl: "https://evil.example.com/p.png",
        },
      ],
      CORE,
    );

    expect(profile).toMatchObject(CORE);
  });

  test("drops the reserved `metadata` claim", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const profile = buildProfileFromClaims(
      [{ metadata: { plan: "spoofed" }, plan: "pro" }],
      CORE,
    );

    expect(profile.metadata).toBeUndefined();
    expect(profile.plan).toBe("pro");
    warn.mockRestore();
  });

  test("drops protocol claims that describe the token, not the user", () => {
    const profile = buildProfileFromClaims(
      [
        {
          exp: 1_700_000_000,
          iat: 1_699_999_000,
          iss: "https://issuer.example.com",
          aud: "client-id",
          nonce: "n",
          plan: "pro",
        },
      ],
      CORE,
    );

    expect(profile).toEqual({ ...CORE, plan: "pro" });
  });

  test("ignores undefined sources", () => {
    expect(buildProfileFromClaims([undefined, undefined], CORE)).toEqual(CORE);
  });
});
