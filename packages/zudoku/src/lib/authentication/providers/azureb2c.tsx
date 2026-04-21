import type { AuthenticationResult, EventMessage } from "@azure/msal-browser";
import { EventType, PublicClientApplication } from "@azure/msal-browser";
import { ErrorBoundary } from "react-error-boundary";
import type { AzureB2CAuthenticationConfig } from "../../../config/config.js";
import { ClientOnly } from "../../components/ClientOnly.js";
import { joinUrl } from "../../util/joinUrl.js";
import type {
  AuthActionContext,
  AuthenticationPlugin,
  AuthenticationProviderInitializer,
  VerifyAccessTokenResult,
} from "../authentication.js";
import { CoreAuthenticationPlugin } from "../AuthenticationPlugin.js";
import { CallbackHandler } from "../components/CallbackHandler.js";
import { OAuthErrorPage } from "../components/OAuthErrorPage.js";
import { AuthorizationError } from "../errors.js";
import { useAuthState } from "../state.js";

export type AzureB2CProviderData = {
  type: "azureb2c";
  accessToken: string;
  idToken: string;
  scopes: string[];
  account: AuthenticationResult["account"];
};

declare module "../state.js" {
  interface ProviderDataRegistry {
    azureb2c: AzureB2CProviderData;
  }
}

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
  private readonly authority: string;
  // The issuer carries the tenant GUID we don't know up-front, so discover.
  private discoveryPromise?: Promise<{ issuer: string; jwks_uri: string }>;
  private jwks?: ReturnType<typeof import("jose").createRemoteJWKSet>;

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

    this.authority = `https://${tenantName}.b2clogin.com/${tenantName}.onmicrosoft.com/${policyName}`;
    const redirectUri = joinUrl(basePath, AZUREB2C_CALLBACK_PATH);

    this.msalInstance = new PublicClientApplication({
      auth: {
        clientId,
        authority: this.authority,
        redirectUri,
        knownAuthorities: [`${tenantName}.b2clogin.com`],
      },
      cache: {
        cacheLocation: "sessionStorage",
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
        type: "azureb2c",
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

  private async getDiscovery() {
    this.discoveryPromise ??= fetch(
      `${this.authority}/v2.0/.well-known/openid-configuration`,
    ).then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Azure B2C discovery failed: ${response.status} ${response.statusText}`,
        );
      }
      return (await response.json()) as { issuer: string; jwks_uri: string };
    });
    return this.discoveryPromise;
  }

  async verifyAccessToken(token: string): Promise<VerifyAccessTokenResult> {
    const jose = await import("jose");
    const { issuer, jwks_uri } = await this.getDiscovery();
    if (!this.jwks) {
      this.jwks = jose.createRemoteJWKSet(new URL(jwks_uri));
    }
    try {
      const { payload } = await jose.jwtVerify(token, this.jwks, { issuer });
      // Match client-side sub (handleAuthResponse uses account.localAccountId, which is oid).
      const sub =
        typeof payload.oid === "string"
          ? payload.oid
          : typeof payload.sub === "string"
            ? payload.sub
            : undefined;
      if (!sub) return undefined;

      const emails = Array.isArray(payload.emails) ? payload.emails : [];
      const email =
        typeof payload.email === "string"
          ? payload.email
          : typeof emails[0] === "string"
            ? emails[0]
            : undefined;

      const fullName = [payload.given_name, payload.family_name]
        .filter((s): s is string => typeof s === "string" && s.length > 0)
        .join(" ");
      const name =
        typeof payload.name === "string" ? payload.name : fullName || undefined;

      return {
        profile: {
          sub,
          email,
          name,
          emailVerified: true,
          pictureUrl: undefined,
        },
        expiresAt: typeof payload.exp === "number" ? payload.exp : undefined,
      };
    } catch (e) {
      // JOSEError = invalid token (→ 401). Rethrow anything else so the
      // handler can surface 502 for misconfig / JWKS fetch failures.
      if (e instanceof jose.errors.JOSEError) return undefined;
      throw e;
    }
  }

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
