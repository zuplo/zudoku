import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Button, Link } from "zudoku/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card.js";
import { useAuthState } from "../../authentication/state.js";
import { useZudoku } from "../../components/context/ZudokuContext.js";

export const SignUp = () => {
  const context = useZudoku();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthState();

  // Existing redirect-based flow for OAuth providers
  useEffect(() => {
    // Only trigger redirect if not using custom UI
    if (!context.authentication?.hasCustomUI) {
      void (
        context.authentication?.signUp() ?? context.authentication?.signIn()
      );
    }
  }, [context.authentication]);

  // Redirect authenticated users away from sign-up page (for email/password flows)
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Check if provider has custom UI
  if (
    context.authentication?.hasCustomUI &&
    context.authentication?.renderSignUpUI
  ) {
    const CustomSignUpUI = context.authentication.renderSignUpUI();
    return (
      <div className="flex items-center justify-center mt-8">
        <CustomSignUpUI />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center mt-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-lg">Sign up</CardTitle>
          <CardDescription>
            You're being redirected to our secure login provider to complete
            your sign up process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 justify-center">
            <Button
              onClick={() => context.authentication?.signIn()}
              variant="default"
            >
              Register
            </Button>
            <Button variant="link" className="text-muted-foreground" asChild>
              <Link to="/">Go home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
