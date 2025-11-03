export interface AuthenticationPlugin {
  signUp(options?: { redirectTo?: string; replace?: boolean }): Promise<void>;
  signIn(options?: { redirectTo?: string; replace?: boolean }): Promise<void>;
  signOut(): Promise<void>;
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
