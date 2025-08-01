import logger from "loglevel";
import * as oauth from "oauth4webapi";
import { ErrorBoundary } from "react-error-boundary";
import type { OpenIDAuthenticationConfig } from "../../../config/config.js";
import { ClientOnly } from "../../components/ClientOnly.js";
import { joinUrl } from "../../util/joinUrl.js";
import { CoreAuthenticationPlugin } from "../AuthenticationPlugin.js";
import type {
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
} from "../authentication.js";
import { CallbackHandler } from "../components/CallbackHandler.js";
import { OAuthErrorPage } from "../components/OAuthErrorPage.js";
import { AuthorizationError, OAuthAuthorizationError } from "../errors.js";
import { type UserProfile, useAuthState } from "../state.js";

const CODE_VERIFIER_KEY = "code-verifier";
const STATE_KEY = "oauth-state";

export interface OpenIdProviderData {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresOn: Date;
  tokenType: string;
}

export const OPENID_CALLBACK_PATH = "/oauth/callback";

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

  constructor({
    issuer,
    audience,
    clientId,
    redirectToAfterSignUp,
    redirectToAfterSignIn,
    redirectToAfterSignOut = "/",
    basePath,
    scopes,
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

    const tokens: OpenIdProviderData = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      idToken: response.id_token,
      expiresOn: new Date(Date.now() + response.expires_in * 1000),
      tokenType: response.token_type,
    };

    useAuthState.setState({
      providerData: tokens,
    });
  }

  async signUp({
    redirectTo,
    replace = false,
  }: {
    redirectTo?: string;
    replace?: boolean;
  } = {}) {
    return this.authorize({
      redirectTo: this.redirectToAfterSignUp ?? redirectTo ?? "/",
      replace,
      isSignUp: true,
    });
  }

  async signIn({
    redirectTo,
    replace = false,
  }: {
    redirectTo?: string;
    replace?: boolean;
  } = {}) {
    return this.authorize({
      redirectTo: this.redirectToAfterSignIn ?? redirectTo ?? "/",
      replace,
    });
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
    const { providerData } = useAuthState.getState();
    if (!providerData) {
      throw new AuthorizationError("User is not authenticated");
    }
    const tokenState = providerData as OpenIdProviderData;

    if (new Date(tokenState.expiresOn) < new Date()) {
      if (!tokenState.refreshToken) {
        useAuthState.setState({
          isAuthenticated: false,
          isPending: false,
          profile: null,
          providerData: null,
        });
        return "";
      }

      const request = await oauth.refreshTokenGrantRequest(
        as,
        this.client,
        tokenState.refreshToken,
      );
      const response = await oauth.processRefreshTokenResponse(
        as,
        this.client,
        request,
      );

      if (!response.access_token) {
        throw new AuthorizationError("No access token in response");
      }

      this.setTokensFromResponse(response);

      return response.access_token.toString();
    } else {
      return tokenState.accessToken;
    }
  }

  signRequest = async (request: Request): Promise<Request> => {
    const accessToken = await this.getAccessToken();
    request.headers.set("Authorization", `Bearer ${accessToken}`);
    return request;
  };

  signOut = async () => {
    useAuthState.setState({
      isAuthenticated: false,
      isPending: false,
      profile: undefined,
      providerData: undefined,
    });

    const as = await this.getAuthServer();

    const redirectUrl = new URL(
      window.location.origin + this.redirectToAfterSignOut,
    );
    redirectUrl.pathname = this.callbackUrlPath;

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

  onPageLoad = async () => {
    const { providerData } = useAuthState.getState();

    if (!providerData) {
      useAuthState.setState({ isPending: false });
      return;
    }

    const tokenState = providerData as OpenIdProviderData;

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
        const request = await oauth.refreshTokenGrantRequest(
          as,
          this.client,
          tokenState.refreshToken,
        );
        const response = await oauth.processRefreshTokenResponse(
          as,
          this.client,
          request,
        );

        if (!response.access_token) {
          throw new AuthorizationError("No access token in response");
        }

        this.setTokensFromResponse(response);
      } catch {
        useAuthState.setState({
          isAuthenticated: false,
          isPending: false,
          profile: null,
          providerData: null,
        });
        return;
      }
    }

    useAuthState.setState({ isPending: false });
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
    if (oauth.isOAuth2Error(params)) {
      logger.error("Error validating OAuth response", params);
      throw new OAuthAuthorizationError(
        "Error validating OAuth response",
        params,
      );
    }

    const redirectUrl = new URL(url);
    redirectUrl.pathname = this.callbackUrlPath;
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
    const oauthResult = await oauth.processAuthorizationCodeOpenIDResponse(
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
    ];
  }
}

const openIDAuth: AuthenticationProviderInitializer<
  OpenIDAuthenticationConfig
> = (options) => new OpenIDAuthenticationProvider(options);

export default openIDAuth;
