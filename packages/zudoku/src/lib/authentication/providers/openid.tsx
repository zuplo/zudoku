import logger from "loglevel";
import * as oauth from "oauth4webapi";
import { NavigateFunction } from "react-router-dom";
import { OpenIDAuthenticationConfig } from "../../../config/config.js";
import { CommonPlugin } from "../../core/plugins.js";
import {
  AuthenticationProvider,
  AuthenticationProviderInitializer,
} from "../authentication.js";
import { AuthenticationPlugin } from "../AuthenticationPlugin.js";
import { AuthorizationError, OAuthAuthorizationError } from "../errors.js";
import { useAuthState, UserProfile } from "../state.js";

const CODE_VERIFIER_KEY = "code-verifier";

interface TokenState {
  accessToken: string;
  refreshToken?: string;
  expiresOn: Date;
  tokenType: string;
}

class OpenIdAuthPlugin extends AuthenticationPlugin {
  constructor(
    private callbackUrlPath: string,
    public initialize?: CommonPlugin["initialize"],
  ) {
    super();
  }
  getRoutes() {
    return [
      ...super.getRoutes(),
      {
        path: this.callbackUrlPath,
        element: <div />,
      },
    ];
  }
}

export class OpenIDAuthenticationProvider implements AuthenticationProvider {
  protected client: oauth.Client;
  protected issuer: string;
  protected authorizationEndpoint: string | undefined;
  protected tokenEndpoint: string | undefined;

  protected authorizationServer: oauth.AuthorizationServer | undefined;
  protected tokens: TokenState | undefined;

  protected callbackUrlPath = "/oauth/callback";
  protected logoutRedirectUrlPath = "/";
  protected onAuthorizationUrl?: (
    authorizationUrl: URL,
    options: { isSignIn: boolean; isSignUp: boolean },
  ) => void;
  private readonly redirectToAfterSignUp: string;
  private readonly redirectToAfterSignIn: string;
  private readonly redirectToAfterSignOut: string;
  private readonly audience?: string;

  constructor({
    issuer,
    audience,
    authorizationEndpoint,
    tokenEndpoint,
    clientId,
    redirectToAfterSignUp,
    redirectToAfterSignIn,
    redirectToAfterSignOut,
  }: OpenIDAuthenticationConfig) {
    this.client = {
      client_id: clientId,
      token_endpoint_auth_method: "none",
    };
    this.audience = audience;
    this.issuer = issuer;
    this.authorizationEndpoint = authorizationEndpoint;
    this.tokenEndpoint = tokenEndpoint;
    this.redirectToAfterSignUp = redirectToAfterSignUp ?? "/";
    this.redirectToAfterSignIn = redirectToAfterSignIn ?? "/";
    this.redirectToAfterSignOut = redirectToAfterSignOut ?? "/";
  }

  protected async getAuthServer() {
    if (!this.authorizationServer) {
      if (this.tokenEndpoint && this.authorizationEndpoint) {
        this.authorizationServer = {
          issuer: new URL(this.authorizationEndpoint!).origin,
          authorization_endpoint: this.authorizationEndpoint,
          token_endpoint: this.tokenEndpoint,
          code_challenge_methods_supported: [],
        };
      } else {
        const issuerUrl = new URL(this.issuer);
        const response = await oauth.discoveryRequest(issuerUrl);
        this.authorizationServer = await oauth.processDiscoveryResponse(
          issuerUrl,
          response,
        );
      }
    }
    return this.authorizationServer;
  }

  /**
   * Sets the tokens from various OAuth responses
   * @param response
   */
  protected setTokensFromResponse(
    response: oauth.TokenEndpointResponse | oauth.OAuth2Error,
  ) {
    if (oauth.isOAuth2Error(response)) {
      logger.error("Bad Token Response", response);
      throw new OAuthAuthorizationError("Bad Token Response", response);
    }

    if (!response.expires_in) {
      throw new AuthorizationError("No expires_in in response");
    }

    this.tokens = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresOn: new Date(Date.now() + response.expires_in * 1000),
      tokenType: response.token_type,
    };
    sessionStorage.setItem("openid-token", JSON.stringify(this.tokens));
  }

  async signUp({ redirectTo }: { redirectTo?: string } = {}) {
    return this.authorize({
      redirectTo: redirectTo ?? this.redirectToAfterSignUp,
      isSignUp: true,
    });
  }

  async signIn({ redirectTo }: { redirectTo?: string } = {}) {
    return this.authorize({
      redirectTo: redirectTo ?? this.redirectToAfterSignIn,
    });
  }

  private async authorize({
    redirectTo,
    isSignUp = false,
  }: {
    redirectTo: string;
    isSignUp?: boolean;
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

    authorizationUrl.searchParams.set("client_id", this.client.client_id);
    authorizationUrl.searchParams.set("redirect_uri", redirectUrl.toString());
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", "openid+profile+email");
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
     * We cannot be sure the AS supports PKCE so we're going to use state too. Use of PKCE is
     * backwards compatible even if the AS doesn't support it which is why we're using it regardless.
     */
    if (
      authorizationServer.code_challenge_methods_supported?.includes("S256") !==
      true
    ) {
      const state = oauth.generateRandomState();
      authorizationUrl.searchParams.set("state", state);
    }

    // now redirect the user to authorizationUrl.href
    location.href = authorizationUrl.href;
  }

  async getAccessToken(): Promise<string> {
    const as = await this.getAuthServer();
    if (!this.tokens) {
      throw new AuthorizationError("User is not authenticated");
    }
    if (this.tokens.expiresOn < new Date()) {
      if (!this.tokens.refreshToken) {
        await this.signIn();
        return "";
      }

      const request = await oauth.refreshTokenGrantRequest(
        as,
        this.client,
        this.tokens.refreshToken,
      );
      const response = await oauth.processRefreshTokenResponse(
        as,
        this.client,
        request,
      );

      this.setTokensFromResponse(response);
    }

    return this.tokens.accessToken;
  }

  signOut = async () => {
    useAuthState.setState({
      isAuthenticated: false,
      isPending: false,
      profile: undefined,
    });
    localStorage.removeItem("auto-login");

    const as = await this.getAuthServer();

    const redirectUrl = new URL(
      window.location.origin + this.redirectToAfterSignOut,
    );
    redirectUrl.pathname = this.logoutRedirectUrlPath;

    let logoutUrl: URL;
    // The endSessionEndpoint is set, the IdP supports some form of logout,
    // so we use the IdP logout. Otherwise, just redirect the user to home
    if (as.end_session_endpoint) {
      logoutUrl = new URL(as.end_session_endpoint);
      // TODO: get id_token and set hint
      // const { id_token } = session;
      // if (id_token) {
      //   logoutUrl.searchParams.set("id_token_hint", id_token);
      // }
      logoutUrl.searchParams.set(
        "post_logout_redirect_uri",
        redirectUrl.toString(),
      );
    } else {
      logoutUrl = redirectUrl;
    }
  };

  handleCallback = async () => {
    const url = new URL(window.location.href);
    const state = url.searchParams.get("state");

    // one eternity later, the user lands back on the redirect_uri
    // Authorization Code Grant Request & Response
    const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
    sessionStorage.removeItem(CODE_VERIFIER_KEY);

    if (!codeVerifier) {
      return "/";
    }

    const authServer = await this.getAuthServer();

    const params = oauth.validateAuthResponse(
      authServer,
      this.client,
      url.searchParams,
      state ?? undefined,
    );
    if (oauth.isOAuth2Error(params)) {
      logger.error("Error validating OAuth response", params);
      throw new OAuthAuthorizationError(
        "Error validating OAuth response",
        params,
      );
    }

    const redirectUrl = new URL(url);
    redirectUrl.pathname = this.redirectToAfterSignIn;
    redirectUrl.search = "";

    const response = await oauth.authorizationCodeGrantRequest(
      authServer,
      this.client,
      params,
      redirectUrl.toString(),
      codeVerifier,
    );

    // TODO: do we need to do these
    // const challenges = oauth.parseWwwAuthenticateChallenges(response);
    // if (challenges) {
    //   for (const challenge of challenges) {
    //     console.error("WWW-Authenticate Challenge", challenge);
    //   }
    //   throw new Error(); // Handle WWW-Authenticate Challenges as needed
    // }
    const oauthResult = await oauth.processAuthorizationCodeOAuth2Response(
      authServer,
      this.client,
      response,
    );

    this.setTokensFromResponse(oauthResult);

    const accessToken = await this.getAccessToken();

    const userInfoResponse = await oauth.userInfoRequest(
      authServer,
      this.client,
      accessToken,
    );
    const userInfo = await userInfoResponse.json();

    const profile: UserProfile = {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      emailVerified: userInfo.email_verified ?? false,
      pictureUrl: userInfo.picture,
    };

    useAuthState.setState({
      isAuthenticated: true,
      isPending: false,
      profile,
    });

    localStorage.setItem("auto-login", "1");

    return sessionStorage.getItem("redirect-to") ?? "/";
  };

  getAuthenticationPlugin() {
    return new OpenIdAuthPlugin(
      this.callbackUrlPath,
      async (_, options: { navigate: NavigateFunction }) => {
        if (typeof window === "undefined") return;

        if (localStorage.getItem("auto-login")) {
          localStorage.removeItem("auto-login");

          await this.authorize({ redirectTo: window.location.pathname });
        } else if (window.location.pathname === "/oauth/callback") {
          const redirect = await this.handleCallback();
          if (redirect) {
            options.navigate(redirect);
          }
        }
      },
    );
  }
}

const openIDAuth: AuthenticationProviderInitializer<
  OpenIDAuthenticationConfig
> = (options) => new OpenIDAuthenticationProvider(options);

export default openIDAuth;
