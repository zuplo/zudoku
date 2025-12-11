import type { NavigateFunction } from "react-router";
import type { ZudokuContext } from "../core/ZudokuContext.js";

export type AuthActionContext = { navigate: NavigateFunction };
export type AuthActionOptions = { redirectTo?: string; replace?: boolean };

export interface AuthenticationPlugin {
  initialize?(context: ZudokuContext): Promise<void>;
  onPageLoad?(): void;
  setNavigate?(navigate: NavigateFunction): void;

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
}

export type AuthenticationProviderInitializer<TConfig> = (
  config: TConfig,
) => AuthenticationPlugin;
