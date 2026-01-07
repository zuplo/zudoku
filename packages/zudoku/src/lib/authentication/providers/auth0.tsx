import type { Auth0AuthenticationConfig } from "../../../config/config.js";
import { joinUrl } from "../../util/joinUrl.js";
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
    if (this.options?.prompt !== undefined) {
      if (this.options.prompt !== "") {
        url.searchParams.set("prompt", this.options.prompt);
      }
    } else if (this.options?.alwaysPromptLogin !== false) {
      url.searchParams.set("prompt", "login");
    }

    if (isSignUp) {
      url.searchParams.set("screen_hint", "signup");
    }
  };

  signOut = async (_: AuthActionContext): Promise<void> => {
    const as = await this.getAuthServer();

    // biome-ignore lint/suspicious/noExplicitAny: We don't have a good way for typing provider-data yet.
    const providerData = useAuthState.getState().providerData as any;
    const idToken = providerData?.idToken;

    useAuthState.setState({
      isAuthenticated: false,
      isPending: false,
      profile: undefined,
      providerData: undefined,
    });

    const redirectUrl = new URL(window.location.origin);
    redirectUrl.pathname = joinUrl(
      import.meta.env.BASE_URL,
      this.redirectToAfterSignOut,
    );

    // SEE: https://auth0.com/docs/authenticate/login/logout/log-users-out-of-auth0
    // For Auth0 tenants created on or after 14 November 2023, RP-Initiated
    // Logout End Session Endpoint Discovery is enabled by default.
    // Otherwise we fallback to the old non-compliant logout

    // The end_session_endpoint is set, the IdP supports some form of logout,
    // so we use auth0 logout. Otherwise, just redirect the user to home
    if (as.end_session_endpoint) {
      const logoutUrl = new URL(as.end_session_endpoint);
      if (idToken) {
        logoutUrl.searchParams.set("id_token_hint", idToken);
      }
      logoutUrl.searchParams.set(
        "post_logout_redirect_uri",
        redirectUrl.toString(),
      );

      window.location.href = logoutUrl.toString();
    } else {
      // const logoutUrl = new URL(`${this.issuer.replace(/\/$/, "")}/v2/logout`);
      // logoutUrl.searchParams.set("returnTo", redirectUrl.toString());
      // don't support the deprecated logout today
    }
  };
}

const auth0Auth: AuthenticationProviderInitializer<
  Auth0AuthenticationConfig
> = (options) => new Auth0AuthenticationProvider(options);

export default auth0Auth;
