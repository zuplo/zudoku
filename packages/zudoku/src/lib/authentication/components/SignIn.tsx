import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { Spinner } from "zudoku/components";
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
      replace: true,
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
          <div className="flex items-center text-sm font-medium gap-2">
            <Spinner /> Redirecting...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
