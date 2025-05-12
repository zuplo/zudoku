import { ZudokuPlugin } from "../core/plugins.js";

export interface AuthenticationProvider {
  signUp(options?: { redirectTo?: string }): Promise<void>;
  signIn(options?: { redirectTo?: string }): Promise<void>;
  signOut(): Promise<void>;
  // @deprecated use signRequest instead
  getAccessToken(): Promise<string>;
  getAuthenticationPlugin?(): ZudokuPlugin;
  onPageLoad?(): void;
  signRequest(request: Request): Promise<Request>;
}

export interface AuthenticationProviderInitializer<TConfig> {
  (config: TConfig): AuthenticationProvider;
}
