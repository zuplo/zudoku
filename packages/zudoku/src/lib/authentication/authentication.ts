import type { NavigateFunction } from "react-router";
import type { ZudokuContext } from "../core/ZudokuContext.js";
import type { UserProfile } from "./state.js";

export type AuthActionContext = { navigate: NavigateFunction };
export type AuthActionOptions = { redirectTo?: string; replace?: boolean };
export type VerifyAccessTokenResult =
  | { profile: UserProfile; expiresAt?: number; refreshExpiresAt?: number }
  | undefined;

export interface AuthenticationPlugin {
  initialize?(context: ZudokuContext): Promise<void>;
  onPageLoad?(): void;

  /*
   * Refreshes the user profile from the authentication provider.
   *
   * This gets called when the user profile needs to be refreshed (e.g. to check if the email is verified)
   */
  refreshUserProfile?(): Promise<boolean>;

  signUp(
    { navigate }: AuthActionContext,
    options?: AuthActionOptions,
  ): Promise<void>;
  signIn(
    { navigate }: AuthActionContext,
    options?: AuthActionOptions,
  ): Promise<void>;

  signOut({ navigate }: AuthActionContext): Promise<void>;

  signRequest(request: Request): Promise<Request>;
  requestEmailVerification?(
    { navigate }: AuthActionContext,
    options?: AuthActionOptions,
  ): Promise<void>;

  /**
   * @deprecated use signRequest instead
   */
  getAccessToken?(): Promise<string>;

  /**
   * @deprecated use the navigate function from the AuthActionContext instead
   */
  setNavigate?(navigate: NavigateFunction): void;

  /**
   * Server-side verification of a client-submitted access token, called by
   * the session-handler before setting the SSR auth cookies. Implementations
   * MUST validate against the IdP (signature, issuer, audience, expiry) and
   * return the verified profile. Return undefined for a rejected token
   * (→ 401); throw for misconfig / upstream failure (→ 502). `expiresAt` /
   * `refreshExpiresAt` are unix seconds used to bound cookie lifetimes so
   * SSR can't outlive a revoked token. Omit to opt out of SSR auth (→ 501).
   */
  verifyAccessToken?(token: string): Promise<VerifyAccessTokenResult>;
}

export type AuthenticationProviderInitializer<TConfig> = (
  config: TConfig,
) => AuthenticationPlugin;
