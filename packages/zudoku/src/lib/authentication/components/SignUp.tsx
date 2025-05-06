import { useEffect } from "react";
import { Button, Link } from "zudoku/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card.js";
import { useZudoku } from "../../components/context/ZudokuContext.js";

export const SignUp = () => {
  const context = useZudoku();

  useEffect(() => {
    void (context.authentication?.signUp() ?? context.authentication?.signIn());
  }, [context.authentication]);

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
