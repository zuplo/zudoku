import { describe, expect, it } from "vitest";
import type { ZudokuConfig } from "../../config/validators/validate.js";
import { getIssuer } from "./issuer.js";

describe("getIssuer", () => {
  it("should return clerk frontend API for clerk authentication", async () => {
    // Using a valid base64 encoded string: "example.example$test" -> "ZXhhbXBsZS5leGFtcGxlJHRlc3Q="
    const config: ZudokuConfig = {
      authentication: {
        type: "clerk",
        clerkPubKey:
          "pk_test_dG9sZXJhbnQtaG9ybmV0LTQ2LmNsZXJrLmFjY291bnRzLmRldiQ",
      },
    };

    const result = await getIssuer(config);
    expect(result).toBe("https://tolerant-hornet-46.clerk.accounts.dev");
  });

  it("should throw error for invalid clerk public key format", async () => {
    const config: ZudokuConfig = {
      authentication: {
        type: "clerk",
        clerkPubKey: "pk_test_invalid",
      },
    };

    await expect(getIssuer(config)).rejects.toThrow(
      "Clerk public key is invalid",
    );
  });

  it("should throw error for clerk key with invalid base64", async () => {
    const config: ZudokuConfig = {
      authentication: {
        type: "clerk",
        clerkPubKey: "pk_test_invalid_base64",
      },
    };

    await expect(getIssuer(config)).rejects.toThrow(
      "Clerk public key is invalid",
    );
  });

  it("should return auth0 issuer URL for auth0 authentication", async () => {
    const config: ZudokuConfig = {
      authentication: {
        type: "auth0",
        domain: "example.auth0.com",
        clientId: "test-client-id",
      },
    };

    const result = await getIssuer(config);
    expect(result).toBe("https://example.auth0.com/");
  });

  it("should return openid issuer for openid authentication", async () => {
    const config: ZudokuConfig = {
      authentication: {
        type: "openid",
        issuer: "https://example.com/auth",
        clientId: "test-client-id",
      },
    };

    const result = await getIssuer(config);
    expect(result).toBe("https://example.com/auth");
  });

  it("should return azureb2c issuer for azureb2c authentication", async () => {
    const config: ZudokuConfig = {
      authentication: {
        type: "azureb2c",
        tenantName: "example",
        policyName: "B2C_1_SignUpSignIn",
        issuer: "https://example.b2clogin.com/example.onmicrosoft.com/v2.0/",
        clientId: "test-client-id",
      },
    };
    const result = await getIssuer(config);
    expect(result).toBe(
      "https://example.b2clogin.com/example.onmicrosoft.com/v2.0/",
    );
  });

  it("should return supabase URL for supabase authentication", async () => {
    const config: ZudokuConfig = {
      authentication: {
        type: "supabase",
        supabaseUrl: "https://project.supabase.co",
        supabaseKey: "test-anon-key",
        provider: "github",
      },
    };

    const result = await getIssuer(config);
    expect(result).toBe("https://project.supabase.co");
  });

  it("should return undefined for no authentication", async () => {
    const config: ZudokuConfig = {};

    const result = await getIssuer(config);
    expect(result).toBeUndefined();
  });

  it("should throw error for unsupported authentication type", async () => {
    const config = {
      authentication: {
        // biome-ignore lint/suspicious/noExplicitAny: Allow any type
        type: "unsupported" as any,
      },
    } as ZudokuConfig;

    await expect(getIssuer(config)).rejects.toThrow(
      "Unsupported authentication type",
    );
  });
});
