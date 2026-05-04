// @vitest-environment happy-dom
import * as oauth from "oauth4webapi";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { OAuthAuthorizationError } from "../errors.js";
import { useAuthState } from "../state.js";
import auth0Auth from "./auth0.js";
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

  describe("authorize URL params", () => {
    let originalHref: string;

    const setLocation = (url: string) => {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: Object.assign(new URL(url), {
          assign: vi.fn(),
          replace: vi.fn(),
        }),
        writable: true,
      });
    };

    beforeEach(() => {
      originalHref = window.location.href;
    });

    afterEach(() => {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: new URL(originalHref),
        writable: true,
      });
    });

    const setAuthEndpoint = () => {
      vi.mocked(oauth.processDiscoveryResponse).mockResolvedValue({
        ...AUTH_SERVER,
        authorization_endpoint: "https://issuer.example.com/authorize",
      });
    };

    const captureAuthorizeUrl = async (
      provider: OpenIDAuthenticationProvider,
    ) => {
      let captured: URL | undefined;
      Object.defineProperty(window, "location", {
        configurable: true,
        value: {
          ...window.location,
          origin: window.location.origin,
          search: window.location.search,
          set href(value: string) {
            captured = new URL(value);
          },
          replace: (value: string) => {
            captured = new URL(value);
          },
        },
      });
      await provider.signIn({ navigate: vi.fn() as never }, {});
      if (!captured) throw new Error("authorize URL not captured");
      return captured;
    };

    test("static authorizationParams reach the authorize URL", async () => {
      setLocation("http://localhost/");
      setAuthEndpoint();

      const provider = new OpenIDAuthenticationProvider({
        type: "openid",
        issuer: "https://issuer.example.com",
        clientId: "test-client",
        authorizationParams: { organization: "org_static" },
      });

      const url = await captureAuthorizeUrl(provider);
      expect(url.searchParams.get("organization")).toBe("org_static");
    });

    test("forwards allow-listed params from current URL", async () => {
      setLocation("http://localhost/?login_hint=alice@example.com&foo=bar");
      setAuthEndpoint();

      const provider = new OpenIDAuthenticationProvider({
        type: "openid",
        issuer: "https://issuer.example.com",
        clientId: "test-client",
      });

      const url = await captureAuthorizeUrl(provider);
      expect(url.searchParams.get("login_hint")).toBe("alice@example.com");
      expect(url.searchParams.get("foo")).toBeNull();
    });

    test("URL params override static authorizationParams", async () => {
      setLocation("http://localhost/?login_hint=runtime@example.com");
      setAuthEndpoint();

      const provider = new OpenIDAuthenticationProvider({
        type: "openid",
        issuer: "https://issuer.example.com",
        clientId: "test-client",
        authorizationParams: { login_hint: "static@example.com" },
      });

      const url = await captureAuthorizeUrl(provider);
      expect(url.searchParams.get("login_hint")).toBe("runtime@example.com");
    });

    test("custom forwardAuthorizationParams extend the allow-list", async () => {
      setLocation("http://localhost/?tenant=acme");
      setAuthEndpoint();

      const provider = new OpenIDAuthenticationProvider({
        type: "openid",
        issuer: "https://issuer.example.com",
        clientId: "test-client",
        forwardAuthorizationParams: ["tenant"],
      });

      const url = await captureAuthorizeUrl(provider);
      expect(url.searchParams.get("tenant")).toBe("acme");
    });

    test("protected core params cannot be overridden via authorizationParams", async () => {
      setLocation("http://localhost/");
      setAuthEndpoint();

      const provider = new OpenIDAuthenticationProvider({
        type: "openid",
        issuer: "https://issuer.example.com",
        clientId: "test-client",
        authorizationParams: {
          client_id: "evil",
          redirect_uri: "https://evil.example.com/cb",
          response_type: "token",
          scope: "evil",
        },
      });

      const url = await captureAuthorizeUrl(provider);
      expect(url.searchParams.get("client_id")).toBe("test-client");
      expect(url.searchParams.get("redirect_uri")).toBe(
        "http://localhost/oauth/callback",
      );
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("scope")).toBe("openid profile email");
    });

    test("protected core params cannot be overridden via forwarded URL params", async () => {
      setLocation("http://localhost/?redirect_uri=https://evil.example.com/cb");
      setAuthEndpoint();

      const provider = new OpenIDAuthenticationProvider({
        type: "openid",
        issuer: "https://issuer.example.com",
        clientId: "test-client",
        forwardAuthorizationParams: ["redirect_uri"],
      });

      const url = await captureAuthorizeUrl(provider);
      expect(url.searchParams.get("redirect_uri")).toBe(
        "http://localhost/oauth/callback",
      );
    });

    test("Auth0 provider forwards organization, invitation, connection by default", async () => {
      setLocation(
        "http://localhost/?organization=org_x&invitation=inv_y&connection=google-oauth2",
      );
      setAuthEndpoint();

      const provider = auth0Auth({
        type: "auth0",
        domain: "issuer.example.com",
        clientId: "test-client",
      });

      const url = await captureAuthorizeUrl(
        provider as OpenIDAuthenticationProvider,
      );
      expect(url.searchParams.get("organization")).toBe("org_x");
      expect(url.searchParams.get("invitation")).toBe("inv_y");
      expect(url.searchParams.get("connection")).toBe("google-oauth2");
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
