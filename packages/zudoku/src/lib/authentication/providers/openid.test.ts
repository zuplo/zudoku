// @vitest-environment happy-dom
import * as oauth from "oauth4webapi";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { OAuthAuthorizationError } from "../errors.js";
import { useAuthState } from "../state.js";
import {
  OpenIDAuthenticationProvider,
  type OpenIdProviderData,
} from "./openid.js";

// Fake JWT-shaped tokens (3 dot-separated segments) to pass the opaque token check
const FAKE_ACCESS_TOKEN = "header.payload.signature";
const FAKE_NEW_ACCESS_TOKEN = "header.newpayload.signature";

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
      customClaims,
    }: {
      claimsEmailVerified?: boolean;
      userInfoEmailVerified?: boolean;
      customClaims?: Record<string, unknown>;
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
        access_token: FAKE_ACCESS_TOKEN,
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
        ...customClaims,
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

    test("throws OAuthAuthorizationError for opaque access tokens", async () => {
      const provider = createProvider();

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
      vi.mocked(oauth.processAuthorizationCodeResponse).mockResolvedValue({
        access_token: "opaque-token-without-dots",
        token_type: "bearer",
        expires_in: 3600,
      } as oauth.TokenEndpointResponse);

      await expect(provider.handleCallback()).rejects.toThrow(
        OAuthAuthorizationError,
      );
    });

    test("emailVerified defaults to false when absent everywhere", async () => {
      const provider = createProvider();
      setupCallback({});

      await provider.handleCallback();

      expect(useAuthState.getState().profile?.emailVerified).toBe(false);
    });

    test("spreads custom claims from userInfo into profile", async () => {
      const provider = createProvider();
      setupCallback({
        userInfoEmailVerified: true,
        customClaims: {
          resource_access: { api: { roles: ["admin"] } },
          custom_role: "editor",
        },
      });

      await provider.handleCallback();

      const profile = useAuthState.getState().profile;
      expect(profile?.resource_access).toEqual({ api: { roles: ["admin"] } });
      expect(profile?.custom_role).toBe("editor");
      expect(profile?.sub).toBe("user-1");
      expect(profile?.email).toBe("user@example.com");
      expect(profile?.emailVerified).toBe(true);
      expect(profile?.pictureUrl).toBe("https://example.com/pic.jpg");
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
          accessToken: FAKE_ACCESS_TOKEN,
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

    test("spreads custom claims from userInfo into profile", async () => {
      const provider = setupRefresh({
        sub: "user-1",
        email: "user@example.com",
        name: "Test",
        email_verified: true,
        resource_access: { api: { roles: ["admin"] } },
        custom_role: "editor",
      });

      await provider.refreshUserProfile();

      const profile = useAuthState.getState().profile;
      expect(profile?.resource_access).toEqual({ api: { roles: ["admin"] } });
      expect(profile?.custom_role).toBe("editor");
      expect(profile?.sub).toBe("user-1");
      expect(profile?.email).toBe("user@example.com");
      expect(profile?.emailVerified).toBe(true);
    });
  });

  describe("signUp config", () => {
    const mockLocation = () => {
      const loc = {
        href: "http://localhost/",
        origin: "http://localhost",
        pathname: "/",
        search: "",
        hash: "",
        assign: vi.fn(),
        replace: vi.fn(),
      };
      Object.defineProperty(window, "location", {
        configurable: true,
        value: loc,
      });
      return loc;
    };

    test("signUp({ url }) bypasses OpenID flow via location.assign", async () => {
      const loc = mockLocation();
      const provider = new OpenIDAuthenticationProvider({
        type: "openid",
        issuer: "https://issuer.example.com",
        clientId: "test-client",
        signUp: { url: "https://app.example.com/register" },
      });

      await provider.signUp({ navigate: vi.fn() }, {});

      expect(loc.assign).toHaveBeenCalledWith(
        "https://app.example.com/register",
      );
      expect(loc.replace).not.toHaveBeenCalled();
    });

    test("signUp({ url }) with relative path uses navigate", async () => {
      mockLocation();
      const navigate = vi.fn();
      const provider = new OpenIDAuthenticationProvider({
        type: "openid",
        issuer: "https://issuer.example.com",
        clientId: "test-client",
        signUp: { url: "/register" },
      });

      await provider.signUp({ navigate }, { replace: true });

      expect(navigate).toHaveBeenCalledWith("/register", { replace: true });
    });

    test("signUp({ url }) with replace uses location.replace", async () => {
      const loc = mockLocation();
      const provider = new OpenIDAuthenticationProvider({
        type: "openid",
        issuer: "https://issuer.example.com",
        clientId: "test-client",
        signUp: { url: "https://app.example.com/register" },
      });

      await provider.signUp({ navigate: vi.fn() }, { replace: true });

      expect(loc.replace).toHaveBeenCalledWith(
        "https://app.example.com/register",
      );
      expect(loc.assign).not.toHaveBeenCalled();
    });

    test("signUp({ authorizationParams }) merges params on signup but not signin", async () => {
      vi.mocked(oauth.processDiscoveryResponse).mockResolvedValue({
        ...AUTH_SERVER,
        authorization_endpoint: "https://issuer.example.com/authorize",
      });

      const provider = new OpenIDAuthenticationProvider({
        type: "openid",
        issuer: "https://issuer.example.com",
        clientId: "test-client",
        signUp: { authorizationParams: { kc_action: "register" } },
      });

      const signupLoc = mockLocation();
      await provider.signUp({ navigate: vi.fn() }, {});
      const signupUrl = new URL(signupLoc.href);
      expect(signupUrl.searchParams.get("kc_action")).toBe("register");

      const signinLoc = mockLocation();
      await provider.signIn({ navigate: vi.fn() }, {});
      const signinUrl = new URL(signinLoc.href);
      expect(signinUrl.searchParams.get("kc_action")).toBeNull();
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
        accessToken: FAKE_ACCESS_TOKEN,
        expiresOn: new Date(Date.now() - 1000),
        refreshToken: "test-refresh-token",
        tokenType: "bearer",
        claims: undefined,
      } satisfies OpenIdProviderData,
    });

    vi.mocked(oauth.refreshTokenGrantRequest).mockResolvedValue(new Response());
    vi.mocked(oauth.processRefreshTokenResponse).mockResolvedValue({
      access_token: FAKE_NEW_ACCESS_TOKEN,
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
