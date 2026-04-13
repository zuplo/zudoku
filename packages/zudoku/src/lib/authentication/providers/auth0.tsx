import type { Auth0AuthenticationConfig } from "../../../config/config.js";
import { joinUrl } from "../../util/joinUrl.js";
import type {
  AuthActionContext,
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
} from "../authentication.js";
import { useAuthState } from "../state.js";
import {
  OPENID_LOGOUT_CALLBACK_PATH,
  OpenIDAuthenticationProvider,
} from "./openid.js";

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

  signOut = async ({ navigate }: AuthActionContext): Promise<void> => {
    const as = await this.getAuthServer();

    const { providerData } = useAuthState.getState();
    const idToken =
      providerData?.type === "openid" ? providerData.idToken : undefined;

    // SEE: https://auth0.com/docs/authenticate/login/logout/log-users-out-of-auth0
    // For Auth0 tenants created on or after 14 November 2023, RP-Initiated
    // Logout End Session Endpoint Discovery is enabled by default.
    // Otherwise we fallback to the old non-compliant logout

    if (as.end_session_endpoint) {
      // Redirect to Auth0 logout without clearing local state.
      // State will be cleared in the logout callback after Auth0 confirms.
      const callbackUrl = new URL(window.location.origin);
      callbackUrl.pathname = joinUrl(
        import.meta.env.BASE_URL,
        OPENID_LOGOUT_CALLBACK_PATH,
      );

      const logoutUrl = new URL(as.end_session_endpoint);
      if (idToken) {
        logoutUrl.searchParams.set("id_token_hint", idToken);
      }
      logoutUrl.searchParams.set("client_id", this.client.client_id);
      logoutUrl.searchParams.set(
        "post_logout_redirect_uri",
        callbackUrl.toString(),
      );

      window.location.href = logoutUrl.toString();
    } else {
      // No external logout — clear state and navigate locally
      useAuthState.getState().setLoggedOut();
      void navigate(this.redirectToAfterSignOut, { replace: true });
    }
  };
}

const auth0Auth: AuthenticationProviderInitializer<
  Auth0AuthenticationConfig
> = (options) => new Auth0AuthenticationProvider(options);

export default auth0Auth;
