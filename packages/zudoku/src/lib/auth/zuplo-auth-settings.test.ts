import { describe, expect, it } from "vitest";
import type { ZudokuConfig } from "../../config/validators/ZudokuConfig.js";
import { getZuploAuthSettings } from "./zuplo-auth-settings.js";

describe("getZuploAuthSettings", () => {
  it("returns issuer, provider, clientId and audience for auth0", async () => {
    const config: ZudokuConfig = {
      authentication: {
        type: "auth0",
        domain: "example.us.auth0.com",
        clientId: "client-123",
        audience: "https://api.example.com/",
      },
    };

    expect(await getZuploAuthSettings(config)).toEqual({
      issuer: "https://example.us.auth0.com/",
      provider: "auth0",
      clientId: "client-123",
      audience: "https://api.example.com/",
    });
  });

  it("returns clientId without audience when none is configured", async () => {
    const config: ZudokuConfig = {
      authentication: {
        type: "openid",
        clientId: "client-123",
        issuer: "https://idp.example.com",
      },
    };

    expect(await getZuploAuthSettings(config)).toEqual({
      issuer: "https://idp.example.com",
      provider: "openid",
      clientId: "client-123",
      audience: undefined,
    });
  });

  it("returns clientId for azureb2c", async () => {
    const config: ZudokuConfig = {
      authentication: {
        type: "azureb2c",
        clientId: "client-123",
        tenantName: "example",
        policyName: "B2C_1_signin",
        issuer: "https://example.b2clogin.com/tenant/v2.0/",
      },
    };

    expect(await getZuploAuthSettings(config)).toEqual({
      issuer: "https://example.b2clogin.com/tenant/v2.0/",
      provider: "azureb2c",
      clientId: "client-123",
    });
  });

  it("returns only issuer and provider for providers without a client ID", async () => {
    const config: ZudokuConfig = {
      authentication: {
        type: "supabase",
        supabaseUrl: "https://example.supabase.co",
        supabaseKey: "anon-key",
        provider: "github",
      },
    };

    expect(await getZuploAuthSettings(config)).toEqual({
      issuer: "https://example.supabase.co",
      provider: "supabase",
    });
  });

  it("returns undefined without authentication", async () => {
    expect(await getZuploAuthSettings({})).toBeUndefined();
  });
});
