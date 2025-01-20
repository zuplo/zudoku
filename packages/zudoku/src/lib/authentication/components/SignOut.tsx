import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useZudoku } from "../../components/context/ZudokuContext.js";

export const SignOut = () => {
  const context = useZudoku();
  const navigate = useNavigate();

  useEffect(() => {
    void context.authentication?.signOut().then(() => navigate("/"));
  }, []);

  return null;
};
