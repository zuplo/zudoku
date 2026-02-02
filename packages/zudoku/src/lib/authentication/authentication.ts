import type { NavigateFunction } from "react-router";
import type { ZudokuContext } from "../core/ZudokuContext.js";

export type AuthActionContext = { navigate: NavigateFunction };
export type AuthActionOptions = { redirectTo?: string; replace?: boolean };

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
}

export type AuthenticationProviderInitializer<TConfig> = (
  config: TConfig,
) => AuthenticationPlugin;
