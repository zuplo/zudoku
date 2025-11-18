import type { Auth0AuthenticationConfig } from "../../../config/config.js";
import type {
  AuthActionContext,
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
} from "../authentication.js";
import { useAuthState } from "../state.js";
import { OpenIDAuthenticationProvider } from "./openid.js";

class Auth0AuthenticationProvider
  extends OpenIDAuthenticationProvider
  implements AuthenticationPlugin
{
  private readonly options: Auth0AuthenticationConfig["options"];
  constructor(config: Auth0AuthenticationConfig) {
    super({
      ...config,
      type: "openid",
      issuer: `https://${config.domain}/`,
      clientId: config.clientId,
      audience: config.audience,
      scopes: config.scopes,
    });
    this.options = config.options;
  }

  onAuthorizationUrl = async (
    url: URL,
    { isSignUp }: { isSignUp: boolean },
  ) => {
    // New prompt option takes precedence over alwaysPromptLogin
    if (this.options?.prompt !== undefined) {
      // If prompt is a non-empty string, set it; if empty string, omit the parameter
      if (this.options.prompt !== "") {
        url.searchParams.set("prompt", this.options.prompt);
      }
    } else if (this.options?.alwaysPromptLogin !== false) {
      // Backward compatibility: keep the original default behavior
      // If alwaysPromptLogin is not explicitly set to false, default to prompt="login"
      url.searchParams.set("prompt", "login");
    }
    // If prompt is empty string or alwaysPromptLogin is false, the prompt parameter is omitted

    if (isSignUp) {
      url.searchParams.set("screen_hint", "signup");
    }
  };

  signOut = async (_: AuthActionContext): Promise<void> => {
    const as = await this.getAuthServer();
    const idToken = await this.getAccessToken();

    useAuthState.setState({
      isAuthenticated: false,
      isPending: false,
      profile: undefined,
      providerData: undefined,
    });

    const redirectUrl = new URL(window.location.origin);
    redirectUrl.pathname = this.redirectToAfterSignOut;

    // SEE: https://auth0.com/docs/authenticate/login/logout/log-users-out-of-auth0
    // For Auth0 tenants created on or after 14 November 2023, RP-Initiated
    // Logout End Session Endpoint Discovery is enabled by default.
    // Otherwise we fallback to the old non-compliant logout

    // The endSessionEndpoint is set, the IdP supports some form of logout,
    // so we use the IdP logout. Otherwise, just redirect the user to home
    if (as.end_session_endpoint) {
      const logoutUrl = new URL(as.end_session_endpoint);
      if (idToken) {
        logoutUrl.searchParams.set("id_token_hint", idToken);
      }
      logoutUrl.searchParams.set(
        "post_logout_redirect_uri",
        redirectUrl.toString(),
      );

      // window.location.href = logoutUrl.toString();
    } else {
      const _logoutUrl = new URL(
        `${this.issuer.replace(/\/$/, "")}/oidc/logout`,
      );
      // window.location.href = logoutUrl.toString();
    }
  };
}

const auth0Auth: AuthenticationProviderInitializer<
  Auth0AuthenticationConfig
> = (options) => new Auth0AuthenticationProvider(options);

export default auth0Auth;
