import { HomeIcon } from "lucide-react";
import { Link } from "react-router";
import { Heading } from "../../components/Heading.js";
import { Markdown } from "../../components/Markdown.js";
import { Typography } from "../../components/Typography.js";
import { Button } from "../../ui/Button.js";
import type { AuthenticationPlugin } from "../authentication.js";
import { OAuthAuthorizationError } from "../errors.js";
import { useAuth } from "../hook.js";
import { useAuthState } from "../state.js";

const errorDetailsMap: Record<string, { message: string }> = {
  invalid_request: {
    message:
      "The authentication request was invalid. Please try signing in again.",
  },
  unauthorized_client: {
    message:
      "This application is not authorized to access your account. Please contact support.",
  },
  access_denied: {
    message:
      "You denied access to this application. To continue, please sign in and grant access.",
  },
  unsupported_response_type: {
    message:
      "The authentication method is not supported. Please contact support.",
  },
  invalid_scope: {
    message: "The requested permissions are invalid. Please contact support.",
  },
  server_error: {
    message:
      "The authentication server encountered an error. Please try again in a few moments.",
  },
  temporarily_unavailable: {
    message:
      "The authentication service is temporarily unavailable. Please try again in a few moments.",
  },
  // Token errors
  invalid_client: {
    message: "Invalid application credentials. Please contact support.",
  },
  invalid_grant: {
    message:
      "The authentication code has expired or is invalid. Please sign in again.",
  },
  unsupported_grant_type: {
    message:
      "The authentication method is not supported. Please contact support.",
  },
  // Custom errors
  invalid_state: {
    message:
      "Security validation failed. This may be due to a potential security attack. Please try signing in again.",
  },
  missing_code_verifier: {
    message:
      "Authentication security information is missing. Please clear your browser cache and try again.",
  },
  network_error: {
    message:
      "A network error occurred during authentication. Please check your connection and try again.",
  },
  token_expired: {
    message: "Your authentication session has expired. Please sign in again.",
  },
  configuration_error: {
    message:
      "There is an issue with the authentication configuration. Please contact support.",
  },
  unknown_error: {
    message:
      "An unexpected error occurred during authentication. Please try again or contact support.",
  },
};

export function AuthErrorPage({
  error,
  authenticationPlugin,
}: {
  error: unknown;
  authenticationPlugin?: AuthenticationPlugin;
}) {
  const { login } = useAuth();

  const handleLoginAgain = async () => {
    // Clear local session state before logging in again
    useAuthState.getState().setLoggedOut();
    await login();
  };

  if (!(error instanceof OAuthAuthorizationError)) {
    throw error;
  }

  const authError = error.error;
  const type = authError.error;

  // Get provider-specific troubleshooting docs
  const troubleshootingDocs = authenticationPlugin?.getTroubleshootingDocs?.({
    error: authError.error,
    error_description: authError.error_description,
    error_code: authError.error_code as string | undefined,
  });

  const details = errorDetailsMap[type] ?? errorDetailsMap.unknown_error;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <Heading level={2} className="text-3xl font-bold">
            {titles[type] || "Authentication Error"}
          </Heading>
          <Typography className="text-lg text-muted-foreground">
            {details?.message}
          </Typography>
        </div>

        {/* Error Details Card */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-destructive text-xl">⚠</span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Error Details
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <span className="font-medium min-w-24">Type:</span>
                  <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                    {authError.error}
                  </code>
                </div>
                {authError.error_description && (
                  <div className="flex gap-2">
                    <span className="font-medium min-w-24">Description:</span>
                    <span className="text-foreground">
                      {authError.error_description}
                    </span>
                  </div>
                )}
                {authError.error_uri && (
                  <div className="flex gap-2">
                    <span className="font-medium min-w-24">More info:</span>
                    <a
                      href={authError.error_uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {authError.error_uri}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {(type === "access_denied" ||
            type === "invalid_grant" ||
            type === "token_expired" ||
            type === "server_error") && (
            <Button onClick={handleLoginAgain} className="flex-1" size="lg">
              Sign in again
            </Button>
          )}
          <Button asChild variant="outline" className="flex-1" size="lg">
            <Link to="/">
              <HomeIcon className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>

        {/* Provider-specific troubleshooting (dev only) */}
        {process.env.NODE_ENV === "development" && troubleshootingDocs && (
          <div className="border-2 border-amber-500/20 rounded-lg p-6 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🛠️</span>
              <div>
                <div className="font-semibold text-amber-900 dark:text-amber-100">
                  Troubleshooting Guide
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  Development mode only
                </div>
              </div>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-amber-900 dark:prose-headings:text-amber-100 prose-a:text-amber-700 dark:prose-a:text-amber-300">
              <Markdown content={troubleshootingDocs} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const titles: Record<string, string> = {
  access_denied: "Access Denied",
  invalid_request: "Invalid Request",
  unauthorized_client: "Unauthorized Application",
  unsupported_response_type: "Unsupported Method",
  invalid_scope: "Invalid Permissions",
  server_error: "Server Error",
  temporarily_unavailable: "Service Unavailable",
  invalid_client: "Invalid Credentials",
  invalid_grant: "Authentication Expired",
  unsupported_grant_type: "Unsupported Authentication",
  invalid_state: "Security Check Failed",
  missing_code_verifier: "Security Information Missing",
  network_error: "Network Error",
  token_expired: "Session Expired",
  configuration_error: "Configuration Error",
  unknown_error: "Authentication Failed",
};
