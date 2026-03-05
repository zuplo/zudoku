// @vitest-environment happy-dom
import * as oauth from "oauth4webapi";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useAuthState } from "../state.js";
import {
  OpenIDAuthenticationProvider,
  type OpenIdProviderData,
} from "./openid.js";

vi.mock("oauth4webapi", async (importOriginal) => {
  const actual = await importOriginal<typeof oauth>();
  return {
    ...actual,
    getValidatedIdTokenClaims: vi.fn(),
    discoveryRequest: vi.fn(),
    processDiscoveryResponse: vi.fn(),
    validateAuthResponse: vi.fn(),
    authorizationCodeGrantRequest: vi.fn(),
    processAuthorizationCodeResponse: vi.fn(),
    refreshTokenGrantRequest: vi.fn(),
    processRefreshTokenResponse: vi.fn(),
    userInfoRequest: vi.fn(),
  };
});

const AUTH_SERVER: oauth.AuthorizationServer = {
  issuer: "https://issuer.example.com",
};

const createProvider = () =>
  new OpenIDAuthenticationProvider({
    type: "openid",
    issuer: "https://issuer.example.com",
    clientId: "test-client",
  });

describe("OpenIDAuthenticationProvider emailVerified", () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    useAuthState.getState().setLoggedOut();
    vi.mocked(oauth.discoveryRequest).mockResolvedValue(new Response());
    vi.mocked(oauth.processDiscoveryResponse).mockResolvedValue(AUTH_SERVER);
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  describe("handleCallback", () => {
    const setupCallback = ({
      claimsEmailVerified,
      userInfoEmailVerified,
    }: {
      claimsEmailVerified?: boolean;
      userInfoEmailVerified?: boolean;
    }) => {
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
        new Response(),
      );

      const hasIdToken = claimsEmailVerified !== undefined;
      vi.mocked(oauth.processAuthorizationCodeResponse).mockResolvedValue({
        access_token: "test-access-token",
        token_type: "bearer",
        expires_in: 3600,
        id_token: hasIdToken ? "test-id-token" : undefined,
        refresh_token: "test-refresh-token",
      } as oauth.TokenEndpointResponse);

      if (hasIdToken) {
        vi.mocked(oauth.getValidatedIdTokenClaims).mockReturnValue({
          email_verified: claimsEmailVerified,
          iss: "https://issuer.example.com",
          sub: "user-1",
          aud: "test-client",
          iat: 0,
          exp: 0,
        });
      }

      const userInfo: Record<string, unknown> = {
        sub: "user-1",
        email: "user@example.com",
        name: "Test User",
        picture: "https://example.com/pic.jpg",
      };
      if (userInfoEmailVerified !== undefined) {
        userInfo.email_verified = userInfoEmailVerified;
      }

      vi.mocked(oauth.userInfoRequest).mockImplementation(() =>
        Promise.resolve(Response.json(userInfo)),
      );
    };

    test("emailVerified is true when userInfo has email_verified", async () => {
      const provider = createProvider();
      setupCallback({ userInfoEmailVerified: true });

      await provider.handleCallback();

      expect(useAuthState.getState().profile?.emailVerified).toBe(true);
    });

    test("emailVerified is false when userInfo has email_verified: false despite claims being true", async () => {
      const provider = createProvider();
      setupCallback({
        claimsEmailVerified: true,
        userInfoEmailVerified: false,
      });

      await provider.handleCallback();

      expect(useAuthState.getState().profile?.emailVerified).toBe(false);
    });

    test("emailVerified is true if idToken claims has email_verified", async () => {
      const provider = createProvider();
      setupCallback({ claimsEmailVerified: true });

      await provider.handleCallback();

      // refreshUserProfile uses `userInfo.email_verified ?? false` without
      // claims fallback, so the idToken value is lost
      expect(useAuthState.getState().profile?.emailVerified).toBe(true);
    });

    test("emailVerified defaults to false when absent everywhere", async () => {
      const provider = createProvider();
      setupCallback({});

      await provider.handleCallback();

      expect(useAuthState.getState().profile?.emailVerified).toBe(false);
    });
  });

  describe("refreshUserProfile", () => {
    const setupRefresh = (userInfo: Record<string, unknown>) => {
      const provider = createProvider();

      useAuthState.setState({
        isAuthenticated: true,
        isPending: false,
        profile: {
          sub: "user-1",
          email: "user@example.com",
          emailVerified: false,
          name: "Test",
          pictureUrl: undefined,
        },
        providerData: {
          type: "openid",
          accessToken: "test-access-token",
          expiresOn: new Date(Date.now() + 3600_000),
          tokenType: "bearer",
          claims: undefined,
        } satisfies OpenIdProviderData,
      });

      vi.mocked(oauth.userInfoRequest).mockResolvedValue(
        Response.json(userInfo),
      );

      return provider;
    };

    test("sets emailVerified from userInfo response", async () => {
      const provider = setupRefresh({
        sub: "user-1",
        email: "user@example.com",
        name: "Test",
        email_verified: true,
        picture: "https://example.com/pic.jpg",
      });

      await provider.refreshUserProfile();

      expect(useAuthState.getState().profile?.emailVerified).toBe(true);
    });

    test("defaults emailVerified to false when userInfo omits it", async () => {
      const provider = setupRefresh({
        sub: "user-1",
        email: "user@example.com",
        name: "Test",
      });

      await provider.refreshUserProfile();

      expect(useAuthState.getState().profile?.emailVerified).toBe(false);
    });
  });

  test("self heals providerData when providerData.type is undefined", async () => {
    const provider = createProvider();

    useAuthState.setState({
      isAuthenticated: true,
      isPending: false,
      profile: {
        sub: "user-1",
        email: "user@example.com",
        emailVerified: false,
        name: "Test",
        pictureUrl: undefined,
      },
      providerData: {
        type: undefined,
        accessToken: "old-access-token",
        expiresOn: new Date(Date.now() - 1000),
        refreshToken: "test-refresh-token",
        tokenType: "bearer",
        claims: undefined,
      } satisfies OpenIdProviderData,
    });

    vi.mocked(oauth.refreshTokenGrantRequest).mockResolvedValue(new Response());
    vi.mocked(oauth.processRefreshTokenResponse).mockResolvedValue({
      access_token: "new-access-token",
      token_type: "bearer",
      expires_in: 3600,
    } as oauth.TokenEndpointResponse);

    vi.mocked(oauth.userInfoRequest).mockResolvedValue(
      Response.json({
        sub: "user-1",
        email: "user@example.com",
        name: "Test",
      }),
    );

    await provider.refreshUserProfile();

    expect(useAuthState.getState().providerData?.type).toBe("openid");
  });
});
