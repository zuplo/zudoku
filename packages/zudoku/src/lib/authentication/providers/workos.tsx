import type { WorkOSAuthenticationConfig } from "../../../config/config.js";
import type {
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
} from "../authentication.js";
import { useAuthState } from "../state.js";
import { OpenIDAuthenticationProvider } from "./openid.js";

class WorkOSAuthenticationProvider
  extends OpenIDAuthenticationProvider
  implements AuthenticationPlugin
{
  constructor(config: WorkOSAuthenticationConfig) {
    super({
      ...config,
      type: "openid",
      issuer: `https://${config.environment}.workos.com/`,
      clientId: config.clientId,
      audience: config.audience,
      scopes: config.scopes,
    });
  }

  onAuthorizationUrl = async (
    url: URL,
    { isSignUp }: { isSignUp: boolean },
  ) => {
    url.searchParams.set("prompt", "login");
    if (isSignUp) {
      url.searchParams.set("screen_hint", "signup");
    }
  };

  signOut = async (): Promise<void> => {
    const as = await this.getAuthServer();
    const idToken = await this.getAccessToken();

    useAuthState.setState({
      isAuthenticated: false,
      isPending: false,
      profile: null,
      providerData: null,
    });

    const redirectUrl = new URL(window.location.origin);
    redirectUrl.pathname = this.redirectToAfterSignOut;

    // WorkOS supports standard OIDC logout via end_session_endpoint
    // Similar to Auth0's newer tenants, WorkOS should support RP-Initiated Logout
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
      // Fallback to basic logout redirect if end_session_endpoint is not available
      // window.location.href = redirectUrl.toString();
    }
  };
}

const workosAuth: AuthenticationProviderInitializer<
  WorkOSAuthenticationConfig
> = (options) => new WorkOSAuthenticationProvider(options);

export default workosAuth;
