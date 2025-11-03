import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Spinner } from "zudoku/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card.js";
import { useAuthState } from "../../authentication/state.js";
import { useZudoku } from "../../components/context/ZudokuContext.js";
import { OAuthAuthorizationError } from "../errors.js";
import { AuthErrorPage } from "./AuthErrorPage.js";

export const SignIn = () => {
  const context = useZudoku();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, oauthError } = useAuthState();

  // Existing redirect-based flow for OAuth providers
  useEffect(() => {
    // Only trigger redirect if not using custom UI and no error
    if (
      !oauthError &&
      !context.authentication?.hasCustomUI &&
      context.authentication?.signIn
    ) {
      void context.authentication.signIn({
        redirectTo: search.get("redirect") ?? undefined,
        replace: true,
      });
    }
  }, [context.authentication, search, oauthError]);

  // Redirect authenticated users away from sign-in page (for email/password flows)
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = search.get("redirect") ?? "/";
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, search]);

  // Clear OAuth error when leaving the error page
  useEffect(() => {
    return () => {
      if (oauthError) {
        useAuthState.setState({ oauthError: undefined });
      }
    };
  }, [oauthError]);

  // Check for OAuth errors and display error page
  if (oauthError) {
    const errorMessage = oauthError.error_description || oauthError.error;
    const error = new OAuthAuthorizationError(
      `OAuth error '${oauthError.error}': ${errorMessage}`,
      {
        error: oauthError.error,
        error_description: oauthError.error_description,
        error_uri: undefined,
      },
    );
    return (
      <AuthErrorPage
        error={error}
        authenticationPlugin={context.authentication}
      />
    );
  }

  // Check if provider has custom UI
  if (
    context.authentication?.hasCustomUI &&
    context.authentication?.renderSignInUI
  ) {
    const CustomSignInUI = context.authentication.renderSignInUI();
    return (
      <div className="flex items-center justify-center mt-8">
        <CustomSignInUI />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center mt-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-lg">Sign in</CardTitle>
          <CardDescription>
            You're being redirected to our secure login provider to complete
            your sign-in process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm font-medium gap-2">
            <Spinner /> Redirecting...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
