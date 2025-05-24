export interface AuthenticationProviderPlugin {
  signUp(options?: { redirectTo?: string }): Promise<void>;
  signIn(options?: { redirectTo?: string }): Promise<void>;
  signOut(): Promise<void>;
  // @deprecated use signRequest instead
  getAccessToken(): Promise<string>;
  onPageLoad?(): void;
  signRequest(request: Request): Promise<Request>;
}

export interface AuthenticationProviderInitializer<TConfig> {
  (config: TConfig): AuthenticationProviderPlugin;
}
