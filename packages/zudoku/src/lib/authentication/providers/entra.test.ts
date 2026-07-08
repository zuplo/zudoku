// @vitest-environment happy-dom
import * as oauth from "oauth4webapi";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useAuthState } from "../state.js";
import entraAuth, { EntraAuthenticationProvider } from "./entra.js";

vi.mock("oauth4webapi", async (importOriginal) => {
  const actual = await importOriginal<typeof oauth>();
  return {
    ...actual,
    discoveryRequest: vi.fn(),
    processDiscoveryResponse: vi.fn(),
    validateAuthResponse: vi.fn(),
    authorizationCodeGrantRequest: vi.fn(),
    processAuthorizationCodeResponse: vi.fn(),
  };
});

const ISSUER_TEMPLATE = "https://login.microsoftonline.com/{tenantid}/v2.0";

// base64url-encoded fake JWT so jose's decodeJwt can read the payload
const fakeJwt = (payload: Record<string, unknown>) => {
  const encode = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/=+$/, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  return `${encode({ alg: "none" })}.${encode(payload)}.signature`;
};

const getAuthServer = (provider: EntraAuthenticationProvider) =>
  (
    provider as unknown as {
      getAuthServer: () => Promise<oauth.AuthorizationServer>;
    }
  ).getAuthServer();

describe("EntraAuthenticationProvider", () => {
  beforeEach(() => {
    useAuthState.getState().setLoggedOut();
    // Replicate oauth4webapi's strict discovery issuer comparison so the
    // tests exercise the real expected-issuer handling.
    vi.mocked(oauth.processDiscoveryResponse).mockImplementation(
      async (expected, response) => {
        const json = (await response.json()) as oauth.AuthorizationServer;
        if (new URL(json.issuer).href !== expected.href) {
          throw new Error('"issuer" property does not match');
        }
        return json;
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  describe("discovery", () => {
    test("multi-tenant authority accepts the templated issuer", async () => {
      vi.mocked(oauth.discoveryRequest).mockResolvedValue(
        Response.json({ issuer: ISSUER_TEMPLATE }),
      );

      const provider = entraAuth({ type: "entra", clientId: "test-client" });
      const as = await getAuthServer(provider as EntraAuthenticationProvider);

      expect(as.issuer).toBe(ISSUER_TEMPLATE);
    });

    test("concrete tenant keeps the strict issuer check", async () => {
      const issuer = "https://login.microsoftonline.com/tenant-abc/v2.0";
      vi.mocked(oauth.discoveryRequest).mockResolvedValue(
        Response.json({ issuer }),
      );

      const provider = new EntraAuthenticationProvider({
        type: "entra",
        clientId: "test-client",
        tenantId: "tenant-abc",
      });

      const as = await getAuthServer(provider);
      expect(as.issuer).toBe(issuer);
    });

    test("mismatched concrete issuer still rejects", async () => {
      vi.mocked(oauth.discoveryRequest).mockResolvedValue(
        Response.json({
          issuer: "https://login.microsoftonline.com/other-tenant/v2.0",
        }),
      );

      const provider = new EntraAuthenticationProvider({
        type: "entra",
        clientId: "test-client",
        tenantId: "tenant-abc",
      });

      await expect(getAuthServer(provider)).rejects.toThrow(
        '"issuer" property does not match',
      );
    });

    test("malformed discovery body falls through to the strict check", async () => {
      vi.mocked(oauth.discoveryRequest).mockResolvedValue(
        new Response("not json"),
      );
      vi.mocked(oauth.processDiscoveryResponse).mockImplementation(
        async (expected) => {
          expect(expected).toBeInstanceOf(URL);
          expect(expected.href).toBe(
            "https://login.microsoftonline.com/common/v2.0",
          );
          throw new Error("failed to parse");
        },
      );

      const provider = new EntraAuthenticationProvider({
        type: "entra",
        clientId: "test-client",
      });

      await expect(getAuthServer(provider)).rejects.toThrow("failed to parse");
    });
  });

  describe("token exchange issuer resolution", () => {
    // Runs handleCallback up to the token exchange, capturing the
    // authorization server it validates against, then short-circuits.
    const captureExchangeIssuer = async (tokenResponse: object) => {
      vi.mocked(oauth.discoveryRequest).mockResolvedValue(
        Response.json({ issuer: ISSUER_TEMPLATE }),
      );

      Object.defineProperty(window, "location", {
        configurable: true,
        value: new URL(
          "http://localhost/oauth/callback?state=test-state&code=test-code",
        ),
      });
      sessionStorage.setItem("oauth-state", "test-state");
      sessionStorage.setItem("code-verifier", "test-verifier");

      vi.mocked(oauth.validateAuthResponse).mockReturnValue(
        new URLSearchParams({ code: "test-code" }),
      );
      vi.mocked(oauth.authorizationCodeGrantRequest).mockResolvedValue(
        Response.json(tokenResponse),
      );

      let issuer: string | undefined;
      vi.mocked(oauth.processAuthorizationCodeResponse).mockImplementation(
        async (as) => {
          issuer = as.issuer;
          throw new Error("stop after capture");
        },
      );

      const provider = new EntraAuthenticationProvider({
        type: "entra",
        clientId: "test-client",
      });
      await expect(provider.handleCallback()).rejects.toThrow(
        "stop after capture",
      );

      return issuer;
    };

    test("substitutes the ID token's tid into the templated issuer", async () => {
      const issuer = await captureExchangeIssuer({
        id_token: fakeJwt({ tid: "tenant-123" }),
      });

      expect(issuer).toBe("https://login.microsoftonline.com/tenant-123/v2.0");
    });

    test("keeps the template when the ID token has no tid", async () => {
      const issuer = await captureExchangeIssuer({
        id_token: fakeJwt({ sub: "user-1" }),
      });

      // Left as-is so oauth4webapi's iss validation fails loudly.
      expect(issuer).toBe(ISSUER_TEMPLATE);
    });

    test("keeps the template when the response has no ID token", async () => {
      const issuer = await captureExchangeIssuer({
        access_token: "header.payload.signature",
      });

      expect(issuer).toBe(ISSUER_TEMPLATE);
    });
  });
});
