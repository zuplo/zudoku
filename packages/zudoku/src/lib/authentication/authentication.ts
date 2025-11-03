export interface AuthenticationPlugin {
  signUp(options?: { redirectTo?: string; replace?: boolean }): Promise<void>;
  signIn(options?: { redirectTo?: string; replace?: boolean }): Promise<void>;
  signOut(): Promise<void>;
  // @deprecated use signRequest instead
  getAccessToken(): Promise<string>;
  onPageLoad?(): void;
  signRequest(request: Request): Promise<Request>;
  /**
   * Optional method to render custom sign-in UI.
   * If provided along with hasCustomUI=true, this will be rendered instead of redirecting.
   * Returns a component function that renders the custom UI.
   */
  renderSignInUI?(): () => React.JSX.Element | null;
  /**
   * Optional method to render custom sign-up UI.
   * If provided along with hasCustomUI=true, this will be rendered instead of redirecting.
   * Returns a component function that renders the custom UI.
   */
  renderSignUpUI?(): () => React.JSX.Element | null;
  /**
   * Indicates whether this provider uses custom UI instead of redirects.
   * If true, the SignIn/SignUp components will render the custom UI.
   */
  hasCustomUI?: boolean;
  /**
   * Optional method to provide troubleshooting documentation for authentication errors.
   * Returns markdown content that will be displayed on the error page.
   * @param error - The OAuth error details
   * @returns Markdown string with troubleshooting steps, or undefined if no docs available
   */
  getTroubleshootingDocs?(error: {
    error: string;
    error_description?: string;
    error_code?: string;
  }): string | undefined;
}

export type AuthenticationProviderInitializer<TConfig> = (
  config: TConfig,
) => AuthenticationPlugin;
