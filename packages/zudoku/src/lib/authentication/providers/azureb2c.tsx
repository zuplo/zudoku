import type { AuthenticationResult, EventMessage } from "@azure/msal-browser";
import { EventType, PublicClientApplication } from "@azure/msal-browser";
import { ErrorBoundary } from "react-error-boundary";
import type { AzureB2CAuthenticationConfig } from "../../../config/config.js";
import { ClientOnly } from "../../components/ClientOnly.js";
import { joinUrl } from "../../util/joinUrl.js";
import { CoreAuthenticationPlugin } from "../AuthenticationPlugin.js";
import type {
  AuthActionContext,
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
} from "../authentication.js";
import { CallbackHandler } from "../components/CallbackHandler.js";
import { OAuthErrorPage } from "../components/OAuthErrorPage.js";
import { AuthorizationError } from "../errors.js";
import { useAuthState } from "../state.js";

const AZUREB2C_CALLBACK_PATH = "/oauth/callback";

export class AzureB2CAuthPlugin
  extends CoreAuthenticationPlugin
  implements AuthenticationPlugin
{
  private msalInstance: PublicClientApplication;
  private readonly scopes: string[];
  private readonly redirectToAfterSignUp?: string;
  private readonly redirectToAfterSignIn?: string;
  private readonly redirectToAfterSignOut: string;

  constructor({
    clientId,
    tenantName,
    policyName,
    scopes,
    redirectToAfterSignUp,
    redirectToAfterSignIn,
    redirectToAfterSignOut = "/",
    basePath = "",
  }: AzureB2CAuthenticationConfig) {
    super();
    this.scopes = scopes ?? ["openid", "profile", "email"];
    this.redirectToAfterSignUp = redirectToAfterSignUp;
    this.redirectToAfterSignIn = redirectToAfterSignIn;
    this.redirectToAfterSignOut = redirectToAfterSignOut;

    const authority = `https://${tenantName}.b2clogin.com/${tenantName}.onmicrosoft.com/${policyName}`;
    const redirectUri = joinUrl(basePath, AZUREB2C_CALLBACK_PATH);

    this.msalInstance = new PublicClientApplication({
      auth: {
        clientId,
        authority,
        redirectUri,
        knownAuthorities: [`${tenantName}.b2clogin.com`],
      },
      cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
      },
    });

    void this.msalInstance.initialize().then(async () => {
      void this.msalInstance
        .handleRedirectPromise()
        .then((response: AuthenticationResult | null) => {
          if (response) {
            this.handleAuthResponse(response);
          }
        });

      // Add event callback
      void this.msalInstance.addEventCallback((event: EventMessage) => {
        if (event.eventType === EventType.LOGIN_SUCCESS) {
          this.handleAuthResponse(event.payload as AuthenticationResult);
        }
      });
    });
  }

  private handleAuthResponse(response: AuthenticationResult) {
    const { accessToken, idToken, scopes, account } = response;

    if (!account) {
      throw new AuthorizationError("No account information in response");
    }

    // Get the user's name from Azure B2C claims
    const name =
      [account.idTokenClaims?.given_name, account.idTokenClaims?.family_name]
        .filter(Boolean)
        .join(" ") || account.username;

    useAuthState.getState().setLoggedIn({
      providerData: {
        accessToken,
        idToken,
        scopes,
        account,
      },
      profile: {
        sub: account.localAccountId,
        email: account.username,
        name,
        emailVerified: true, // Azure B2C emails are verified
        pictureUrl: undefined, // Azure B2C doesn't provide profile pictures by default
      },
    });
  }

  async signUp(
    _: AuthActionContext,
    { redirectTo }: { redirectTo?: string } = {},
  ) {
    const redirectUri = this.redirectToAfterSignUp ?? redirectTo ?? "/";
    sessionStorage.setItem("redirect-to", redirectUri);

    await this.msalInstance.loginRedirect({
      scopes: this.scopes,
      prompt: "select_account",
    });
  }

  async signIn(
    _: AuthActionContext,
    { redirectTo }: { redirectTo?: string } = {},
  ) {
    const redirectUri = this.redirectToAfterSignIn ?? redirectTo ?? "/";
    sessionStorage.setItem("redirect-to", redirectUri);

    await this.msalInstance.loginRedirect({
      scopes: this.scopes,
    });
  }

  async getAccessToken(): Promise<string> {
    const account = this.msalInstance.getAllAccounts()[0];
    if (!account) {
      throw new AuthorizationError("No active account");
    }

    try {
      const response = await this.msalInstance.acquireTokenSilent({
        scopes: this.scopes,
        account,
      });
      return response.accessToken;
    } catch {
      // If silent token acquisition fails, try interactive
      await this.msalInstance.acquireTokenRedirect({
        scopes: this.scopes,
        account,
      });

      throw new AuthorizationError(
        "Token acquisition failed after interactive attempt",
      );
    }
  }

  signRequest = async (request: Request): Promise<Request> => {
    const accessToken = await this.getAccessToken();
    request.headers.set("Authorization", `Bearer ${accessToken}`);
    return request;
  };

  signOut = async (_: AuthActionContext) => {
    const account = this.msalInstance.getAllAccounts()[0];
    if (account) {
      await this.msalInstance.logoutRedirect({
        account,
        postLogoutRedirectUri:
          window.location.origin + this.redirectToAfterSignOut,
      });
    }

    useAuthState.getState().setLoggedOut();
  };

  handleCallback = async () => {
    const redirectTo = sessionStorage.getItem("redirect-to") ?? "/";
    sessionStorage.removeItem("redirect-to");
    return redirectTo;
  };

  getRoutes() {
    return [
      ...super.getRoutes(),
      {
        path: AZUREB2C_CALLBACK_PATH,
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

const azureB2CAuth: AuthenticationProviderInitializer<
  AzureB2CAuthenticationConfig
> = (options) => new AzureB2CAuthPlugin(options);

export default azureB2CAuth;
