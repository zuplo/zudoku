import type { JWTPayload } from "jose";
import * as oauth from "oauth4webapi";
import { ErrorBoundary } from "react-error-boundary";
import type { NavigateFunction } from "react-router";
import type { OpenIDAuthenticationConfig } from "../../../config/config.js";
import { ClientOnly } from "../../components/ClientOnly.js";
import { joinUrl } from "../../util/joinUrl.js";
import type {
  AuthActionContext,
  AuthActionOptions,
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
  VerifyAccessTokenResult,
} from "../authentication.js";
import { CoreAuthenticationPlugin } from "../AuthenticationPlugin.js";
import { CallbackHandler } from "../components/CallbackHandler.js";
import { LogoutCallbackHandler } from "../components/LogoutCallbackHandler.js";
import { OAuthErrorPage } from "../components/OAuthErrorPage.js";
import { fetchServerSession } from "../cookie-sync.js";
import { DEFAULT_SESSION_MAX_AGE, SESSION_ENDPOINT_PATH } from "../cookies.js";
import { AuthorizationError } from "../errors.js";
import { type UserProfile, useAuthState } from "../state.js";
import { redirectToSignUpUrl } from "./util.js";

const CODE_VERIFIER_KEY = "code-verifier";
const STATE_KEY = "oauth-state";

// ID token claims that describe the token or the sign-in event rather than
// the user. UserInfo never returns them, so they are dropped when the profile
// is built from the ID token instead.
const ID_TOKEN_PROTOCOL_CLAIMS = new Set([
  "iss",
  "aud",
  "exp",
  "iat",
  "nbf",
  "jti",
  "nonce",
  "azp",
  "at_hash",
  "c_hash",
  "s_hash",
  "auth_time",
  "acr",
  "amr",
  "sid",
]);

const userInfoFromIdTokenClaims = (
  claims: oauth.IDToken,
): oauth.UserInfoResponse => ({
  ...Object.fromEntries(
    Object.entries(claims).filter(
      ([key]) => !ID_TOKEN_PROTOCOL_CLAIMS.has(key),
    ),
  ),
  sub: claims.sub,
});

const stringClaim = (value: unknown) =>
  typeof value === "string" ? value : undefined;

const decodeJwtExp = async (token: string): Promise<number | undefined> => {
  try {
    const { decodeJwt } = await import("jose");
    const payload = decodeJwt(token);
    return typeof payload.exp === "number" ? payload.exp : undefined;
  } catch {
    return undefined;
  }
};

export interface OpenIdProviderData {
  // just for easy migration we also allow for undefined type. can be removed in the future.
  type: "openid" | undefined;
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresOn: Date;
  tokenType: string;
  claims: oauth.IDToken | undefined;
}

declare module "../state.js" {
  interface ProviderDataRegistry {
    openid: OpenIdProviderData;
  }
}

export const OPENID_CALLBACK_PATH = "/oauth/callback";
export const OPENID_LOGOUT_CALLBACK_PATH = "/oauth/logout-callback";

export class OpenIDAuthenticationProvider
  extends CoreAuthenticationPlugin
  implements AuthenticationPlugin
{
  protected client: oauth.Client;
  protected issuer: string;
  protected authorizationServer: oauth.AuthorizationServer | undefined;

  protected callbackUrlPath: string;

  protected onAuthorizationUrl?: (
    authorizationUrl: URL,
    options: { isSignIn: boolean; isSignUp: boolean },
  ) => void;

  protected readonly redirectToAfterSignUp: string | undefined;
  protected readonly redirectToAfterSignIn: string | undefined;
  protected readonly redirectToAfterSignOut: string;
  private readonly audience?: string;
  private readonly scopes: string[];
  private readonly signUpConfig?: OpenIDAuthenticationConfig["signUp"];
  public readonly disableSignUp: boolean;
  protected readonly authorizationParams?: Record<string, string>;
  protected readonly forwardAuthorizationParams: string[];
  protected static readonly DEFAULT_FORWARD_AUTHORIZATION_PARAMS = [
    "login_hint",
    "domain_hint",
    "ui_locales",
    "acr_values",
  ];
  private readonly allowInsecureRequests: boolean;
  private readonly disableUserInfo: boolean;
  private readonly sessionEndpoint: string;
  private serverSessionHydration?: Promise<OpenIdProviderData | undefined>;
  private jwks?: ReturnType<typeof import("jose").createRemoteJWKSet>;

  constructor({
    issuer,
    audience,
    clientId,
    redirectToAfterSignUp,
    redirectToAfterSignIn,
    redirectToAfterSignOut = "/",
    basePath,
    scopes,
    signUp,
    disableSignUp,
    authorizationParams,
    forwardAuthorizationParams,
    allowInsecureRequests,
    disableUserInfo,
  }: OpenIDAuthenticationConfig) {
    super();
    this.client = {
      client_id: clientId,
      token_endpoint_auth_method: "none",
    };
    this.audience = audience;
    this.issuer = issuer;
    // This is the callback URL for the OAuth provider. So it needs the base path.
    this.callbackUrlPath = joinUrl(basePath, OPENID_CALLBACK_PATH);
    this.sessionEndpoint = joinUrl(basePath, SESSION_ENDPOINT_PATH);
    this.scopes = scopes ?? ["openid", "profile", "email"];
    this.allowInsecureRequests = allowInsecureRequests ?? false;
    this.disableUserInfo = disableUserInfo ?? false;

    this.redirectToAfterSignUp = redirectToAfterSignUp;
    this.redirectToAfterSignIn = redirectToAfterSignIn;
    this.redirectToAfterSignOut = redirectToAfterSignOut;
    this.signUpConfig = signUp;
    this.disableSignUp = disableSignUp ?? false;
    this.authorizationParams = authorizationParams;
    this.forwardAuthorizationParams = Array.from(
      new Set([
        ...OpenIDAuthenticationProvider.DEFAULT_FORWARD_AUTHORIZATION_PARAMS,
        ...(forwardAuthorizationParams ?? []),
      ]),
    );
  }

  protected get oauthOptions() {
    return this.allowInsecureRequests
      ? { [oauth.allowInsecureRequests]: true }
      : {};
  }

  protected async getAuthServer() {
    if (!this.authorizationServer) {
      const issuerUrl = new URL(this.issuer);
      const response = await oauth.discoveryRequest(
        issuerUrl,
        this.oauthOptions,
      );

      this.authorizationServer = await oauth.processDiscoveryResponse(
        await this.getExpectedDiscoveryIssuer(issuerUrl, response),
        response,
      );
    }
    return this.authorizationServer;
  }

  // Override points for providers whose issuers deviate from the spec (see
  // EntraAuthenticationProvider). Overrides must peek via `response.clone()`;
  // the body is consumed downstream.
  protected async getExpectedDiscoveryIssuer(
    issuerUrl: URL,
    _response: Response,
  ): Promise<URL> {
    return issuerUrl;
  }

  protected async resolveTokenIssuer(
    as: oauth.AuthorizationServer,
    _response: Response,
  ): Promise<oauth.AuthorizationServer> {
    return as;
  }

  // The `iss` a JWT access token must carry when it is verified without
  // UserInfo. Called with the payload only after its signature checked out.
  protected getExpectedAccessTokenIssuer(
    as: oauth.AuthorizationServer,
    _payload: Record<string, unknown>,
  ): string {
    return as.issuer;
  }

  // Off when the config opts out (`disableUserInfo: true`) or the issuer doesn't
  // advertise the endpoint. The profile then comes from the ID token in the
  // browser, and from the verified JWT access token on the server.
  protected usesUserInfo(as: oauth.AuthorizationServer): boolean {
    return !this.disableUserInfo && typeof as.userinfo_endpoint === "string";
  }

  /**
   * Sets the tokens from various OAuth responses
   * @param response
   * @param previous The token state a refresh replaces. Refresh responses
   *   usually omit the ID token, so the last one is kept: its claims are the
   *   profile when UserInfo is off, and it is the `id_token_hint` at sign-out.
   */
  protected setTokensFromResponse(
    response: oauth.TokenEndpointResponse,
    previous?: OpenIdProviderData,
  ) {
    if (!response.expires_in) {
      throw new AuthorizationError("No expires_in in response");
    }

    const claims = response.id_token
      ? oauth.getValidatedIdTokenClaims(response)
      : previous?.claims;

    const tokens: OpenIdProviderData = {
      type: "openid",
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      idToken: response.id_token ?? previous?.idToken,
      expiresOn: new Date(Date.now() + response.expires_in * 1000),
      tokenType: response.token_type,
      claims,
    };

    const emailVerified =
      claims?.email_verified === undefined
        ? undefined
        : Boolean(claims?.email_verified);

    useAuthState.setState((state) => {
      const profile = state.profile
        ? {
            ...state.profile,
            emailVerified:
              emailVerified ?? state.profile.emailVerified ?? false,
          }
        : null;

      return {
        profile,
        providerData: tokens,
      };
    });
  }

  async signUp(
    { navigate }: { navigate: NavigateFunction },
    {
      redirectTo,
      replace = false,
    }: {
      redirectTo?: string;
      replace?: boolean;
    } = {},
  ) {
    if (this.signUpConfig && "url" in this.signUpConfig) {
      redirectToSignUpUrl(this.signUpConfig.url, navigate, replace);
      return;
    }
    return this.authorize({
      redirectTo: this.redirectToAfterSignUp ?? redirectTo ?? "/",
      replace,
      isSignUp: true,
    });
  }

  async signIn(
    _: AuthActionContext,
    { redirectTo, replace = false }: AuthActionOptions,
  ) {
    return this.authorize({
      redirectTo: this.redirectToAfterSignIn ?? redirectTo ?? "/",
      replace,
    });
  }

  protected buildUserProfile(
    userInfo: oauth.UserInfoResponse,
    claims: oauth.IDToken | undefined,
  ): UserProfile {
    const emailVerified =
      userInfo.email_verified ?? claims?.email_verified ?? false;
    return {
      ...userInfo,
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      emailVerified: Boolean(emailVerified),
      pictureUrl: userInfo.picture,
    };
  }

  public async verifyAccessToken(
    token: string,
  ): Promise<VerifyAccessTokenResult> {
    const authServer = await this.getAuthServer();
    return this.usesUserInfo(authServer)
      ? this.verifyAccessTokenWithUserInfo(authServer, token)
      : this.verifyJwtAccessToken(authServer, token);
  }

  private async verifyAccessTokenWithUserInfo(
    authServer: oauth.AuthorizationServer,
    token: string,
  ): Promise<VerifyAccessTokenResult> {
    const response = await oauth.userInfoRequest(
      authServer,
      this.client,
      token,
      this.oauthOptions,
    );
    if (!response.ok) return undefined;
    const userInfo = (await response.json()) as Record<string, unknown>;
    if (!userInfo.sub) return undefined;

    // userInfoRequest authenticated the token upstream; parsing `exp` here
    // lets us bound the cookie lifetime to the token's. Opaque tokens just
    // yield undefined and fall back to the handler's default.
    const expiresAt = await decodeJwtExp(token);

    return {
      profile: {
        sub: String(userInfo.sub),
        email: userInfo.email as string | undefined,
        name: userInfo.name as string | undefined,
        emailVerified: Boolean(userInfo.email_verified),
        pictureUrl: userInfo.picture as string | undefined,
      },
      expiresAt,
    };
  }

  // A token the issuer minted for another application must not open a session
  // here. With `audience` set, jwtVerify has already checked `aud`. Without
  // it, this client has to be named in `aud` or in the claim saying who the
  // token was issued to: `azp` (OIDC), `client_id` (RFC 9068) or `cid` (Okta).
  private isIssuedToThisClient(payload: JWTPayload): boolean {
    if (this.audience) return true;

    const clientId = this.client.client_id;
    const audiences =
      typeof payload.aud === "string" ? [payload.aud] : (payload.aud ?? []);
    return (
      audiences.includes(clientId) ||
      [payload.azp, payload.client_id, payload.cid].includes(clientId)
    );
  }

  // Without UserInfo the access token has to be a JWT signed by the issuer: it
  // is checked against the issuer's JWKS, must expire, and must be issued to
  // this application. The profile comes from its claims. Opaque tokens can't
  // be verified this way, so they are rejected.
  private async verifyJwtAccessToken(
    authServer: oauth.AuthorizationServer,
    token: string,
  ): Promise<VerifyAccessTokenResult> {
    if (!authServer.jwks_uri) {
      throw new AuthorizationError(
        "The issuer advertises no jwks_uri, so access tokens can't be verified without UserInfo",
      );
    }

    const jose = await import("jose");
    this.jwks ??= jose.createRemoteJWKSet(new URL(authServer.jwks_uri));

    try {
      const { payload } = await jose.jwtVerify(token, this.jwks, {
        // jwtVerify only checks `exp` when present; a token without one could
        // keep opening sessions forever.
        requiredClaims: ["exp"],
        ...(this.audience && { audience: this.audience }),
      });

      const sub = stringClaim(payload.sub);
      if (
        !sub ||
        payload.iss !==
          this.getExpectedAccessTokenIssuer(authServer, payload) ||
        !this.isIssuedToThisClient(payload)
      ) {
        return undefined;
      }

      return {
        profile: {
          sub,
          email: stringClaim(payload.email),
          name: stringClaim(payload.name),
          emailVerified: Boolean(payload.email_verified),
          pictureUrl: stringClaim(payload.picture),
        },
        expiresAt: typeof payload.exp === "number" ? payload.exp : undefined,
      };
    } catch (e) {
      // A JWKS that can't be loaded is an outage (→ 502, cookies kept), not a
      // bad token. jose reports a non-200 or unparsable JWKS response as a
      // bare JOSEError, which carries the generic code.
      if (
        e instanceof jose.errors.JWKSTimeout ||
        e instanceof jose.errors.JWKSInvalid ||
        (e instanceof jose.errors.JOSEError &&
          e.code === jose.errors.JOSEError.code)
      ) {
        throw e;
      }
      // Any other JOSEError is an invalid, expired or opaque token (→ 401).
      if (e instanceof jose.errors.JOSEError) return undefined;
      throw e;
    }
  }

  public async refreshUserProfile(): Promise<boolean> {
    // SSR mode doesn't persist `providerData`; tokens live only in the
    // httpOnly cookie. Without client-side tokens we can't call userInfo —
    // the SSR-supplied profile stays authoritative.
    if (!useAuthState.getState().providerData) return false;

    const accessToken = await this.getAccessToken();
    const authServer = await this.getAuthServer();

    const { providerData } = useAuthState.getState();
    const claims =
      providerData?.type === "openid" ? providerData.claims : undefined;

    let userInfo: oauth.UserInfoResponse;
    if (this.usesUserInfo(authServer)) {
      const userInfoResponse = await oauth.userInfoRequest(
        authServer,
        this.client,
        accessToken,
        this.oauthOptions,
      );
      userInfo = await userInfoResponse.json();
    } else {
      // No ID token to build from, e.g. a session restored from the SSR
      // cookie. Keep the profile we already have.
      if (!claims) return false;
      userInfo = userInfoFromIdTokenClaims(claims);
    }

    const profile = this.buildUserProfile(userInfo, claims);

    useAuthState.setState({
      isAuthenticated: true,
      isPending: false,
      profile,
    });

    return true;
  }

  private async authorize({
    redirectTo,
    isSignUp = false,
    replace = false,
  }: {
    redirectTo: string;
    isSignUp?: boolean;
    replace?: boolean;
  }): Promise<void> {
    const code_challenge_method = "S256";
    const authorizationServer = await this.getAuthServer();

    if (!authorizationServer.authorization_endpoint) {
      throw new AuthorizationError("No authorization endpoint");
    }

    /**
     * The following MUST be generated for every redirect to the authorization_endpoint. You must store
     * the codeVerifier and nonce in the end-user session such that it can be recovered as the user
     * gets redirected from the authorization server back to your application.
     */
    const codeVerifier = oauth.generateRandomCodeVerifier();
    const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);

    sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);

    // redirect user to as.authorization_endpoint
    const authorizationUrl = new URL(
      authorizationServer.authorization_endpoint,
    );

    sessionStorage.setItem("redirect-to", redirectTo);

    const redirectUrl = new URL(window.location.origin);
    redirectUrl.pathname = this.callbackUrlPath;
    redirectUrl.search = "";
    redirectUrl.hash = "";

    // Apply user-supplied params first so core OIDC params below cannot be overridden (client_id, etc.)
    if (this.authorizationParams) {
      for (const [key, value] of Object.entries(this.authorizationParams)) {
        authorizationUrl.searchParams.set(key, value);
      }
    }

    if (
      isSignUp &&
      this.signUpConfig &&
      "authorizationParams" in this.signUpConfig
    ) {
      for (const [key, value] of Object.entries(
        this.signUpConfig.authorizationParams,
      )) {
        authorizationUrl.searchParams.set(key, value);
      }
    }

    if (typeof window !== "undefined") {
      const incoming = new URLSearchParams(window.location.search);
      for (const name of this.forwardAuthorizationParams) {
        const value = incoming.get(name);
        if (value !== null) {
          authorizationUrl.searchParams.set(name, value);
        }
      }
    }

    authorizationUrl.searchParams.set("client_id", this.client.client_id);
    authorizationUrl.searchParams.set("redirect_uri", redirectUrl.toString());
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", this.scopes.join(" "));
    authorizationUrl.searchParams.set("code_challenge", codeChallenge);
    authorizationUrl.searchParams.set(
      "code_challenge_method",
      code_challenge_method,
    );
    if (this.audience) {
      authorizationUrl.searchParams.set("audience", this.audience);
    }

    this.onAuthorizationUrl?.(authorizationUrl, {
      isSignIn: !isSignUp,
      isSignUp,
    });

    /**
     * The state parameter is used to prevent CSRF attacks and should be used in all authorization requests.
     * It is independent of PKCE and should be used regardless of PKCE support.
     */
    const state = oauth.generateRandomState();
    sessionStorage.setItem(STATE_KEY, state);
    authorizationUrl.searchParams.set("state", state);

    if (replace) {
      location.replace(authorizationUrl.href);
    } else {
      location.href = authorizationUrl.href;
    }
  }

  // In SSR mode tokens live in httpOnly cookies and don't survive a full
  // navigation. Restore the access token from the session endpoint and cache
  // it as providerData so subsequent calls take the regular path.
  private async restoreServerSession(): Promise<
    OpenIdProviderData | undefined
  > {
    const session = await fetchServerSession(this.sessionEndpoint);
    if (!session) return;

    const expiresAt =
      session.expiresAt ?? (await decodeJwtExp(session.accessToken));

    const providerData: OpenIdProviderData = {
      type: "openid",
      accessToken: session.accessToken,
      expiresOn: expiresAt
        ? new Date(expiresAt * 1000)
        : new Date(Date.now() + DEFAULT_SESSION_MAX_AGE * 1000),
      tokenType: "Bearer",
      claims: undefined,
    };

    useAuthState.setState({ providerData });

    return providerData;
  }

  // Dedupes concurrent restores only: the cache is dropped once settled. A
  // successful restore lives on in providerData, and anything else (no
  // session, failure, a later logout clearing providerData) must re-check the
  // cookie-backed session instead of reusing a stale result.
  private hydrateFromServerSession() {
    this.serverSessionHydration ??= this.restoreServerSession().finally(() => {
      this.serverSessionHydration = undefined;
    });
    return this.serverSessionHydration;
  }

  async getAccessToken(): Promise<string> {
    const as = await this.getAuthServer();
    const { providerData, setLoggedOut } = useAuthState.getState();

    let tokenState =
      providerData &&
      (providerData.type === "openid" || providerData.type === undefined)
        ? providerData
        : undefined;

    if (
      !tokenState &&
      import.meta.env.ZUDOKU_HAS_SERVER &&
      typeof window !== "undefined"
    ) {
      tokenState = await this.hydrateFromServerSession();
    }

    // A missing session is a confirmed logout; transient failures threw above.
    if (!tokenState) {
      setLoggedOut();
      throw new AuthorizationError("Invalid or incompatible provider data");
    }

    if (new Date(tokenState.expiresOn) < new Date()) {
      if (!tokenState.refreshToken) {
        useAuthState.getState().setLoggedOut();
        throw new AuthorizationError("No refresh token found");
      }

      const response = await oauth.refreshTokenGrantRequest(
        as,
        this.client,
        oauth.None(),
        tokenState.refreshToken,
        this.oauthOptions,
      );

      const result = await oauth.processRefreshTokenResponse(
        await this.resolveTokenIssuer(as, response),
        this.client,
        response,
      );

      if (!result.access_token) {
        setLoggedOut();
        throw new AuthorizationError("No access token in response");
      }

      this.setTokensFromResponse(result, tokenState);

      return result.access_token.toString();
    } else {
      return tokenState.accessToken;
    }
  }

  signRequest = async (request: Request): Promise<Request> => {
    const accessToken = await this.getAccessToken();
    request.headers.set("Authorization", `Bearer ${accessToken}`);
    return request;
  };

  signOut = async (_: AuthActionContext) => {
    const { providerData } = useAuthState.getState();
    const idToken =
      providerData?.type === "openid" || providerData?.type === undefined
        ? providerData?.idToken
        : undefined;

    const as = await this.getAuthServer();

    if (as.end_session_endpoint) {
      // IdP supports external logout — redirect without clearing local state.
      // State will be cleared in the logout callback after the IdP confirms.
      const callbackUrl = new URL(window.location.origin);
      callbackUrl.pathname = joinUrl(
        import.meta.env.BASE_URL,
        OPENID_LOGOUT_CALLBACK_PATH,
      );

      const logoutUrl = new URL(as.end_session_endpoint);
      if (idToken) {
        logoutUrl.searchParams.set("id_token_hint", idToken);
      }
      logoutUrl.searchParams.set(
        "post_logout_redirect_uri",
        callbackUrl.toString(),
      );

      window.location.href = logoutUrl.toString();
    } else {
      // No external logout endpoint — clear state immediately and redirect
      useAuthState.getState().setLoggedOut();

      const redirectUrl = new URL(window.location.origin);
      redirectUrl.pathname = joinUrl(
        import.meta.env.BASE_URL,
        this.redirectToAfterSignOut,
      );
      window.location.href = redirectUrl.toString();
    }
  };

  onPageLoad = async () => {
    const { providerData } = useAuthState.getState();

    if (providerData?.type !== "openid") {
      return;
    }
    const tokenState = providerData;

    if (new Date(tokenState.expiresOn) < new Date()) {
      if (!tokenState.refreshToken) {
        useAuthState.setState({
          isAuthenticated: false,
          isPending: false,
          profile: null,
          providerData: null,
        });
        return;
      }

      try {
        const as = await this.getAuthServer();
        const response = await oauth.refreshTokenGrantRequest(
          as,
          this.client,
          oauth.None(),
          tokenState.refreshToken,
          this.oauthOptions,
        );
        const result = await oauth.processRefreshTokenResponse(
          await this.resolveTokenIssuer(as, response),
          this.client,
          response,
        );

        if (!result.access_token) {
          throw new AuthorizationError("No access token in response");
        }

        this.setTokensFromResponse(result, tokenState);
      } catch {
        useAuthState.getState().setLoggedOut();
        return;
      }
    }

    useAuthState.setState({ isPending: false });
  };

  handleLogoutCallback = () => {
    useAuthState.getState().setLoggedOut();
    return this.redirectToAfterSignOut;
  };

  handleCallback = async () => {
    const url = new URL(window.location.href);
    const state = url.searchParams.get("state");
    const storedState = sessionStorage.getItem(STATE_KEY);
    sessionStorage.removeItem(STATE_KEY);

    if (state !== storedState) {
      throw new AuthorizationError("Invalid state parameter");
    }

    // one eternity later, the user lands back on the redirect_uri
    // Authorization Code Grant Request & Response
    const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
    sessionStorage.removeItem(CODE_VERIFIER_KEY);
    if (!codeVerifier) {
      throw new AuthorizationError("No code verifier found in state.");
    }

    const authServer = await this.getAuthServer();

    const params = oauth.validateAuthResponse(
      authServer,
      this.client,
      url.searchParams,
      state ?? undefined,
    );

    const redirectUrl = new URL(url);
    redirectUrl.pathname = this.callbackUrlPath;
    redirectUrl.search = "";
    redirectUrl.hash = "";

    const response = await oauth.authorizationCodeGrantRequest(
      authServer,
      this.client,
      oauth.None(),
      params,
      redirectUrl.toString(),
      codeVerifier,
      this.oauthOptions,
    );

    const oauthResult = await oauth.processAuthorizationCodeResponse(
      await this.resolveTokenIssuer(authServer, response),
      this.client,
      response,
    );

    if (!this.usesUserInfo(authServer) && !oauthResult.id_token) {
      throw new AuthorizationError(
        "The token response contains no ID token, and UserInfo is disabled or not offered by the issuer, so there is no user profile to sign in with. Request the `openid` scope.",
      );
    }

    this.setTokensFromResponse(oauthResult);
    await this.refreshUserProfile();

    const redirectTo = sessionStorage.getItem("redirect-to") ?? "/";
    sessionStorage.removeItem("redirect-to");
    return redirectTo;
  };

  getRoutes() {
    return [
      ...super.getRoutes(),
      {
        path: OPENID_CALLBACK_PATH,
        element: (
          <ClientOnly>
            <ErrorBoundary
              fallbackRender={({ error }) => <OAuthErrorPage error={error} />}
            >
              <CallbackHandler handleCallback={this.handleCallback} />
            </ErrorBoundary>
          </ClientOnly>
        ),
      },
      {
        path: OPENID_LOGOUT_CALLBACK_PATH,
        element: (
          <ClientOnly>
            <LogoutCallbackHandler
              handleLogoutCallback={this.handleLogoutCallback}
            />
          </ClientOnly>
        ),
      },
    ];
  }
}

const openIDAuth: AuthenticationProviderInitializer<
  OpenIDAuthenticationConfig
> = (options) => new OpenIDAuthenticationProvider(options);

export default openIDAuth;
