/**
 * Lightweight i18n core for Zudoku.
 *
 * - Translation keys are flat strings (e.g. "openapi.downloadSchema").
 * - Placeholders use the ICU MessageFormat `{name}` syntax for a single value.
 *   Pluralization / formatting helpers can be added later by swapping the
 *   `interpolate()` implementation for `@formatjs/intl-messageformat` without
 *   changing call sites.
 * - Default English messages live alongside the code that uses them. Plugins
 *   contribute their own keys via the `getTranslations()` plugin hook so the
 *   catalog stays modular. End users override any key via `i18n.messages` in
 *   their Zudoku config.
 */

export type TranslationMessages = Record<string, string>;

export type TranslationCatalog = Record<string, TranslationMessages>;

export type I18nOptions = {
  /** Locale to render in. Falls back to `defaultLocale` when missing. */
  locale?: string;
  /** Locale used when a key is missing from the active locale. Defaults to "en". */
  defaultLocale?: string;
  /** Per-locale message dictionaries. Each entry merges over plugin + core defaults. */
  messages?: TranslationCatalog;
};

export type ResolvedI18n = {
  locale: string;
  defaultLocale: string;
  /** Merged catalog: core defaults < plugin defaults < user overrides. */
  catalog: TranslationCatalog;
};

/**
 * Default (English) catalog shipped with the core. Plugin defaults are merged
 * in by the runtime, so plugin authors don't have to touch this file.
 */
export const defaultMessages: TranslationMessages = {
  // Navigation / shell
  "nav.title": "Navigation",
  "nav.openMenu": "Open navigation menu",
  "nav.myAccount": "My Account",
  "nav.login": "Login",
  "nav.logout": "Logout",

  // Developer hint
  "developerHint.title": "Developer hint",
  "developerHint.devOnly": "Only shown in development mode.",

  // Mermaid
  "mermaid.error": "Mermaid Error",

  // Not found
  "notFound.title": "Page not found",
  "notFound.body":
    "It seems that the page you are looking for does not exist or may have been moved. Please check the URL for any typos or use the navigation menu to find the correct page.",
  "notFound.goHome": "Go back home",
  "notFound.developerHint":
    "Start by adding a file at `{root}/{path}.mdx` and add some content to make this error go away. By default `DOCUMENT_ROOT` is the `pages` directory.",

  // Errors / status pages
  "error.default.title": "An error occurred",
  "error.default.message":
    "Something went wrong while processing your request.",
  "error.400.title": "Bad Request",
  "error.400.message":
    "The request could not be understood by the server due to malformed syntax.",
  "error.403.title": "Forbidden",
  "error.403.message": "You don't have permission to access this resource.",
  "error.404.title": "Not Found",
  "error.404.message": "The requested resource could not be found.",
  "error.405.title": "Method Not Allowed",
  "error.405.message":
    "The request method is not supported for the requested resource.",
  "error.414.title": "Request URI Too Large",
  "error.414.message": "The request URI is too large.",
  "error.416.title": "Range Not Satisfiable",
  "error.416.message": "The server cannot satisfy the request range.",
  "error.500.title": "Internal Server Error",
  "error.500.message":
    "An unexpected error occurred while processing your request.",
  "error.501.title": "Not Implemented",
  "error.501.message":
    "The server does not support the functionality required to fulfill the request.",
  "error.502.title": "Bad Gateway",
  "error.502.message":
    "The server received an invalid response from the upstream server.",
  "error.503.title": "Service Unavailable",
  "error.503.message":
    "The server is temporarily unable to handle the request.",
  "error.504.title": "Gateway Timeout",
  "error.504.message":
    "The server did not receive a timely response from the upstream server.",

  // AI assistants
  "ai.useInClaude": "Use in Claude",
  "ai.useInChatGPT": "Use in ChatGPT",
  "ai.prompt.api": "Help me understand this API: {pageUrl}",
  "ai.prompt.docs": "Help me understand this documentation page: {pageUrl}",

  // Authentication — shared
  "auth.error": "Error",
  "auth.emailSent": "Email sent",
  "auth.email": "E-Mail",
  "auth.emailPlaceholder": "Email",
  "auth.emailExamplePlaceholder": "you@example.com",
  "auth.password": "Password",
  "auth.passwordPlaceholder": "Password",
  "auth.newPassword": "New password",
  "auth.confirmPassword": "Confirm password",
  "auth.newPasswordPlaceholder": "Enter new password",
  "auth.confirmPasswordPlaceholder": "Confirm new password",
  "auth.passwordsDoNotMatch": "Passwords do not match",
  "auth.checkSpamFolder":
    "Make sure to check your spam folder if you don't see the email.",
  "auth.didntReceiveEmail": "Didn't receive the email?",

  // Sign in / sign up redirect cards
  "auth.signIn": "Sign in",
  "auth.signUp": "Sign up",
  "auth.signInRedirect":
    "You're being redirected to our secure login provider to complete your sign-in process.",
  "auth.signUpRedirect":
    "You're being redirected to our secure login provider to complete your sign up process.",
  "auth.redirecting": "Redirecting...",
  "auth.register": "Register",
  "auth.goHome": "Go home",

  // ZudokuAuthUi - sign in
  "auth.signInDescription": "Sign in to your account to continue.",
  "auth.forgotPassword": "Forgot password?",
  "auth.signInWithEmailLink": "Sign in with email link",
  "auth.dontHaveAccount": "Don't have an account? Sign up.",
  "auth.orContinueWith": "or continue with",

  // ZudokuAuthUi - sign up
  "auth.signUpDescription": "Sign up to your account to continue.",
  "auth.alreadyHaveAccount": "Already have an account? Sign in.",

  // Sign up disabled
  "auth.signUpsUnavailable": "Sign ups are not currently available.",
  "auth.invitationRequired": "Invitation required",
  "auth.invitationRequiredDescription":
    "New accounts are by invitation only. If you already have an account, you can sign in below.",
  "auth.backToSignIn": "Back to sign in",

  // Password reset
  "auth.resetPassword": "Reset password",
  "auth.resetPasswordDescription":
    "Enter your email address and we'll send you a link to reset your password.",
  "auth.resetPasswordSubmitted": "Check your email for a password reset link.",
  "auth.resetPasswordEmailSentDescription":
    "If an account exists with that email address, you will receive a password reset link shortly.",

  // Password update
  "auth.setNewPassword": "Set new password",
  "auth.setNewPasswordDescription": "Enter your new password below.",
  "auth.passwordUpdated": "Password updated",
  "auth.passwordUpdatedDescription":
    "Your password has been successfully updated. You can now sign in with your new password.",
  "auth.passwordUpdateSuccess": "Your password has been updated successfully.",
  "auth.updatePassword": "Update password",

  // Email verification
  "auth.verifyEmail": "Verify your email",
  "auth.verifyEmailDescription": "We've sent a verification link",
  "auth.verificationEmailSent":
    "A new verification email has been sent. Please check your inbox.",
  "auth.checkingVerification": "Checking verification...",
  "auth.emailNotVerified":
    "Your email hasn't been verified yet. Please check your inbox and click the verification link.",
  "auth.continue": "Continue",
  "auth.resendVerificationEmail": "Resend verification email",

  // Email link
  "auth.checkYourEmail": "Check your email",
  "auth.emailLinkSentTo": "We've sent a sign-in link to {email}.",
  "auth.emailLinkResent":
    "A new sign-in link has been sent. Please check your inbox.",
  "auth.resendEmailLink": "Resend sign-in link",
  "auth.emailLinkSignInDescription":
    "Enter your email and we'll send you a link to sign in.",
  "auth.sendSignInLink": "Send sign-in link",

  // Email link callback
  "auth.invalidSignInLink": "Invalid sign-in link",
  "auth.invalidSignInLinkDescription":
    "This sign-in link is invalid or has expired. Please request a new one.",
  "auth.requestNewSignInLink": "Request a new sign-in link",
  "auth.signingYouIn": "Signing you in...",
  "auth.signingYouInDescription": "Please wait while we complete your sign-in.",
  "auth.confirmYourEmail": "Confirm your email",
  "auth.confirmYourEmailDescription":
    "Please enter the email address you used to request the sign-in link.",
  "auth.completeSignIn": "Complete sign-in",

  // OAuth error page
  "auth.oauth.title.default": "Authentication Error",
  "auth.oauth.title.access_denied": "Access Denied",
  "auth.oauth.title.invalid_request": "Invalid Request",
  "auth.oauth.title.unauthorized_client": "Unauthorized Application",
  "auth.oauth.title.unsupported_response_type": "Unsupported Method",
  "auth.oauth.title.invalid_scope": "Invalid Permissions",
  "auth.oauth.title.server_error": "Server Error",
  "auth.oauth.title.temporarily_unavailable": "Service Unavailable",
  "auth.oauth.title.invalid_client": "Invalid Credentials",
  "auth.oauth.title.invalid_grant": "Authentication Expired",
  "auth.oauth.title.unsupported_grant_type": "Unsupported Authentication",
  "auth.oauth.title.invalid_state": "Security Check Failed",
  "auth.oauth.title.missing_code_verifier": "Security Information Missing",
  "auth.oauth.title.network_error": "Network Error",
  "auth.oauth.title.token_expired": "Session Expired",
  "auth.oauth.title.configuration_error": "Configuration Error",
  "auth.oauth.title.unknown_error": "Authentication Failed",
  "auth.oauth.message.invalid_request":
    "The authentication request was invalid. Please try signing in again.",
  "auth.oauth.message.unauthorized_client":
    "This application is not authorized to access your account.",
  "auth.oauth.message.access_denied":
    "You denied access to this application. To continue, please sign in and grant access.",
  "auth.oauth.message.unsupported_response_type":
    "The authentication method is not supported.",
  "auth.oauth.message.invalid_scope": "The requested permissions are invalid.",
  "auth.oauth.message.server_error":
    "The authentication server encountered an error. Please try again in a few moments.",
  "auth.oauth.message.temporarily_unavailable":
    "The authentication service is temporarily unavailable. Please try again in a few moments.",
  "auth.oauth.message.invalid_client": "Invalid application credentials.",
  "auth.oauth.message.invalid_grant":
    "The authentication code has expired or is invalid. Please sign in again.",
  "auth.oauth.message.unsupported_grant_type":
    "The authentication method is not supported.",
  "auth.oauth.message.invalid_state":
    "Security validation failed. This may be due to a potential security attack. Please try signing in again.",
  "auth.oauth.message.missing_code_verifier":
    "Authentication security information is missing. Please clear your browser cache and try again.",
  "auth.oauth.message.network_error":
    "A network error occurred during authentication. Please check your connection and try again.",
  "auth.oauth.message.token_expired":
    "Your authentication session has expired. Please sign in again.",
  "auth.oauth.message.configuration_error":
    "There is an issue with the authentication configuration.",
  "auth.oauth.message.unknown_error":
    "An unexpected error occurred during authentication. Please try again or contact support.",
  "auth.oauth.help.access_denied":
    "If you changed your mind, you can try signing in again to grant access.",
  "auth.oauth.help.invalid_state":
    "This error can occur if you have multiple tabs open or if your session was compromised.",
  "auth.oauth.help.missing_code_verifier":
    "Try clearing your browser's cache and cookies for this site.",
  "auth.oauth.help.network_error":
    "Check your internet connection and ensure you can access other websites.",
  "auth.oauth.help.server_error":
    "The issue is on our end. Our team has been notified and is working to fix it.",
  "auth.oauth.help.temporarily_unavailable":
    "This is usually temporary. Try again in a few minutes.",
  "auth.oauth.signInAgain": "Sign in again",
  "auth.oauth.goHome": "Go Home",
  "auth.oauth.errorLabel": "Error",
  "auth.oauth.descriptionLabel": "Description",
  "auth.oauth.moreInfoLabel": "More info",
};

const PLACEHOLDER = /\{(\w+)\}/g;

export const interpolate = (
  template: string,
  values?: Record<string, string | number>,
): string => {
  if (!values) return template;
  return template.replace(PLACEHOLDER, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
};

export const mergeCatalogs = (
  ...catalogs: Array<TranslationCatalog | undefined>
): TranslationCatalog => {
  const merged: TranslationCatalog = {};
  for (const catalog of catalogs) {
    if (!catalog) continue;
    for (const [locale, messages] of Object.entries(catalog)) {
      merged[locale] = { ...merged[locale], ...messages };
    }
  }
  return merged;
};

export const resolveI18n = (
  options: I18nOptions | undefined,
  pluginCatalogs: TranslationCatalog[],
): ResolvedI18n => {
  const defaultLocale = options?.defaultLocale ?? "en";
  const locale = options?.locale ?? defaultLocale;

  const catalog = mergeCatalogs(
    { [defaultLocale]: defaultMessages },
    ...pluginCatalogs,
    options?.messages,
  );

  return { locale, defaultLocale, catalog };
};

export const translate = (
  i18n: ResolvedI18n,
  key: string,
  values?: Record<string, string | number>,
): string => {
  const active = i18n.catalog[i18n.locale]?.[key];
  const fallback = i18n.catalog[i18n.defaultLocale]?.[key];
  // If a key has no translation at all we return the key itself so missing
  // strings are obvious during development.
  const template = active ?? fallback ?? key;
  return interpolate(template, values);
};
