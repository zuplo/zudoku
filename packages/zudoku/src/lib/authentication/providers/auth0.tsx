import { Auth0AuthenticationConfig } from "../../../config/config.js";
import { AuthenticationProviderInitializer } from "../authentication.js";
import { useAuthState } from "../state.js";
import { OpenIDAuthenticationProvider } from "./openid.js";

class Auth0AuthenticationProvider extends OpenIDAuthenticationProvider {
  constructor(config: Auth0AuthenticationConfig) {
    super({
      ...config,
      type: "openid",
      issuer: `https://${config.domain}`,
      clientId: config.clientId,
      audience: config.audience,
    });
  }

  onAuthorizationUrl = async (
    url: URL,
    { isSignUp }: { isSignUp: boolean },
  ) => {
    if (isSignUp) {
      url.searchParams.set("screen_hint", "signup");
    }
  };

  signOut = async (): Promise<void> => {
    useAuthState.setState({
      isAuthenticated: false,
      isPending: false,
      profile: undefined,
    });
    sessionStorage.clear();
    const as = await this.getAuthServer();

    const redirectUrl = new URL(
      window.location.origin + this.logoutRedirectUrlPath,
    );
    redirectUrl.pathname = this.logoutRedirectUrlPath;

    // SEE: https://auth0.com/docs/authenticate/login/logout/log-users-out-of-auth0
    // For Auth0 tenants created on or after 14 November 2023, RP-Initiated
    // Logout End Session Endpoint Discovery is enabled by default.
    // Otherwise we fallback to the old non-compliant logout

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
      logoutUrl = new URL(`${this.issuer}oidc/logout`);
    }
  };
}

const auth0Auth: AuthenticationProviderInitializer<
  Auth0AuthenticationConfig
> = (options) => new Auth0AuthenticationProvider(options);

export default auth0Auth;
