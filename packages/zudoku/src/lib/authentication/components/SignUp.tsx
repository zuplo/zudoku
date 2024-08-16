import { useEffect } from "react";
import { useZudoku } from "../../components/context/ZudokuContext.js";

export const SignUp = () => {
  const context = useZudoku();
  useEffect(() => {
    void (context.authentication?.signUp() ?? context.authentication?.signIn());
  }, [context.authentication]);

  return null;
};
