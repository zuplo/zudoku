import type { NavigateFunction } from "react-router";

export type AuthHandlerContext = { navigate: NavigateFunction };
export type AuthHandlerOptions = { redirectTo?: string; replace?: boolean };

export interface AuthenticationPlugin {
  signUp(
    { navigate }: AuthHandlerContext,
    options?: AuthHandlerOptions,
  ): Promise<void>;
  signIn(
    { navigate }: AuthHandlerContext,
    options?: AuthHandlerOptions,
  ): Promise<void>;
  signOut({ navigate }: AuthHandlerContext): Promise<void>;
  /**
   * @deprecated use signRequest instead
   */
  getAccessToken(): Promise<string>;
  onPageLoad?(): void;
  signRequest(request: Request): Promise<Request>;
}

export type AuthenticationProviderInitializer<TConfig> = (
  config: TConfig,
) => AuthenticationPlugin;
