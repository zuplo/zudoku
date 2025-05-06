import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "zudoku/ui/Button.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card.js";
import { useZudoku } from "../../components/context/ZudokuContext.js";

export const SignIn = () => {
  const context = useZudoku();
  const [search] = useSearchParams();
  useEffect(() => {
    void context.authentication?.signIn({
      redirectTo: search.get("redirect") ?? undefined,
    });
  }, [context.authentication, search]);

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
          <div className="flex flex-col gap-2 justify-center">
            <Button
              onClick={() => context.authentication?.signIn()}
              variant="default"
            >
              Login
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
