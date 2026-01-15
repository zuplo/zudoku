import { HomeIcon } from "lucide-react";
import { Link } from "react-router";
import { Heading } from "../../components/Heading.js";
import { Typography } from "../../components/Typography.js";
import { Button } from "../../ui/Button.js";
import { OAuthAuthorizationError } from "../errors.js";
import { useAuth } from "../hook.js";

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

export function OAuthErrorPage({ error }: { error: unknown }) {
  const { login } = useAuth();

  if (!(error instanceof OAuthAuthorizationError)) {
    throw error;
  }

  const oauthError = error.error;
  const type =
    oauthError && typeof oauthError === "object" && "error" in oauthError
      ? String(oauthError.error)
      : "unknown_error";

  const details = errorDetailsMap[type] ?? errorDetailsMap.unknown_error;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-4 items-center">
          <Heading level={2} className="text-2xl inline-block font-bold">
            {titles[type] || "Authentication Error"}
          </Heading>

          <Typography className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {details?.message}
          </Typography>

          {/* Technical details for developers (only in development) */}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <div className="space-y-2">
            {(type === "access_denied" ||
              type === "invalid_grant" ||
              type === "token_expired") && (
              <Button
                onClick={() => login()}
                className="w-full capitalize"
                variant={"default"}
              >
                Sign in again
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button asChild className="flex-1" variant="outline">
              <Link to="/">
                <HomeIcon className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </div>
        </div>

        {/* Additional Help */}
        {helpMessages[type] && (
          <Typography className="text-sm text-gray-500 dark:text-gray-400">
            {helpMessages[type]}
          </Typography>
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

const helpMessages: Record<string, string> = {
  access_denied:
    "If you changed your mind, you can try signing in again to grant access.",
  invalid_state:
    "This error can occur if you have multiple tabs open or if your session was compromised.",
  missing_code_verifier:
    "Try clearing your browser's cache and cookies for this site.",
  network_error:
    "Check your internet connection and ensure you can access other websites.",
  server_error:
    "The issue is on our end. Our team has been notified and is working to fix it.",
  temporarily_unavailable:
    "This is usually temporary. Try again in a few minutes.",
};
