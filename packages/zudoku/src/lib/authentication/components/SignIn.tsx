import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { useZudoku } from "../../components/context/ZudokuContext.js";

export const SignIn = () => {
  const context = useZudoku();
  const [search] = useSearchParams();
  useEffect(() => {
    void context.authentication?.signIn({
      redirectTo: search.get("redirect") ?? undefined,
    });
  }, [context.authentication, search]);

  return null;
};
