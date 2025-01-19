import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useZudoku } from "../../components/context/ZudokuContext.js";

export const SignOut = () => {
  const context = useZudoku();
  const navigate = useNavigate();

  useSuspenseQuery({
    queryKey: ["signout"],
    queryFn: async () => {
      void (await context.authentication?.signOut());
      void navigate("/");
    },
  });

  return null;
};
