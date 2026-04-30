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
} from "../authentication.js";
import { CoreAuthenticationPlugin } from "../AuthenticationPlugin.js";
import { CallbackHandler } from "../components/CallbackHandler.js";
import { LogoutCallbackHandler } from "../components/LogoutCallbackHandler.js";
import { OAuthErrorPage } from "../components/OAuthErrorPage.js";
import { AuthorizationError, OAuthAuthorizationError } from "../errors.js";
import { type UserProfile, useAuthState } from "../state.js";

const CODE_VERIFIER_KEY = "code-verifier";
const STATE_KEY = "oauth-state";

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
  protected readonly authorizationParams?: Record<string, string>;
  protected readonly forwardAuthorizationParams: string[];
  protected static readonly DEFAULT_FORWARD_AUTHORIZATION_PARAMS = [
    "login_hint",
    "domain_hint",
    "ui_locales",
    "acr_values",
  ];

  constructor({
    issuer,
    audience,
    clientId,
    redirectToAfterSignUp,
    redirectToAfterSignIn,
    redirectToAfterSignOut = "/",
    basePath,
    scopes,
    authorizationParams,
    forwardAuthorizationParams,
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
    this.scopes = scopes ?? ["openid", "profile", "email"];

    this.redirectToAfterSignUp = redirectToAfterSignUp;
    this.redirectToAfterSignIn = redirectToAfterSignIn;
    this.redirectToAfterSignOut = redirectToAfterSignOut;
    this.authorizationParams = authorizationParams;
    this.forwardAuthorizationParams = Array.from(
      new Set([
        ...OpenIDAuthenticationProvider.DEFAULT_FORWARD_AUTHORIZATION_PARAMS,
        ...(forwardAuthorizationParams ?? []),
      ]),
    );
  }

  protected async getAuthServer() {
    if (!this.authorizationServer) {
      const issuerUrl = new URL(this.issuer);
      const response = await oauth.discoveryRequest(issuerUrl);
      this.authorizationServer = await oauth.processDiscoveryResponse(
        issuerUrl,
        response,
      );
    }
    return this.authorizationServer;
  }

  /**
   * Sets the tokens from various OAuth responses
   * @param response
   */
  protected setTokensFromResponse(response: oauth.TokenEndpointResponse) {
    if (!response.expires_in) {
      throw new AuthorizationError("No expires_in in response");
    }

    const accessToken = response.access_token;
    if (accessToken.split(".").length !== 3) {
      throw new OAuthAuthorizationError(
        "The access token received is not a valid JWT.",
        {
          error: "configuration_error",
          error_description:
            "The authentication provider is issuing opaque tokens instead of JWTs. " +
            "Ensure you have configured the correct `audience` in your authentication settings.",
        },
      );
    }

    const claims = response.id_token
      ? oauth.getValidatedIdTokenClaims(response)
      : undefined;

    const tokens: OpenIdProviderData = {
      type: "openid",
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      idToken: response.id_token,
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
    _: { navigate: NavigateFunction },
    {
      redirectTo,
      replace = false,
    }: {
      redirectTo?: string;
      replace?: boolean;
    } = {},
  ) {
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

  private buildUserProfile(
    userInfo: oauth.UserInfoResponse,
    fallbackEmailVerified: oauth.JsonValue | undefined,
  ): UserProfile {
    const emailVerified =
      userInfo.email_verified ?? fallbackEmailVerified ?? false;
    return {
      ...userInfo,
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      emailVerified: Boolean(emailVerified),
      pictureUrl: userInfo.picture,
    };
  }

  public async refreshUserProfile(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    const authServer = await this.getAuthServer();

    const userInfoResponse = await oauth.userInfoRequest(
      authServer,
      this.client,
      accessToken,
    );
    const userInfo = await userInfoResponse.json();

    const { providerData } = useAuthState.getState();
    const emailVerified =
      providerData?.type === "openid"
        ? providerData.claims?.email_verified
        : undefined;

    const profile = this.buildUserProfile(userInfo, emailVerified);

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

  async getAccessToken(): Promise<string> {
    const as = await this.getAuthServer();
    const { providerData, setLoggedOut } = useAuthState.getState();

    if (
      !providerData ||
      (providerData?.type !== "openid" && providerData?.type !== undefined)
    ) {
      useAuthState.getState().setLoggedOut();
      throw new AuthorizationError("Invalid or incompatible provider data");
    }

    const tokenState = providerData;

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
      );
      const result = await oauth.processRefreshTokenResponse(
        as,
        this.client,
        response,
      );

      if (!result.access_token) {
        setLoggedOut();
        throw new AuthorizationError("No access token in response");
      }

      this.setTokensFromResponse(result);

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
        );
        const result = await oauth.processRefreshTokenResponse(
          as,
          this.client,
          response,
        );

        if (!result.access_token) {
          throw new AuthorizationError("No access token in response");
        }

        this.setTokensFromResponse(result);
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
    );

    const oauthResult = await oauth.processAuthorizationCodeResponse(
      authServer,
      this.client,
      response,
    );

    this.setTokensFromResponse(oauthResult);

    const accessToken = await this.getAccessToken();

    const { providerData } = useAuthState.getState();
    const claims =
      providerData?.type === "openid" ? providerData.claims : undefined;

    const userInfoResponse = await oauth.userInfoRequest(
      authServer,
      this.client,
      accessToken,
    );
    const userInfo = await userInfoResponse.json();

    const profile = this.buildUserProfile(userInfo, claims?.email_verified);

    useAuthState.setState({
      isAuthenticated: true,
      isPending: false,
      profile,
    });
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
