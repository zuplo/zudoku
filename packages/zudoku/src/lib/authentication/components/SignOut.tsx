import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useZudoku } from "../../components/context/ZudokuContext.js";

export const SignOut = () => {
  const context = useZudoku();
  const navigate = useNavigate();
  useEffect(() => {
    void context.authentication?.signOut().then(() => navigate("/"));
  }, [navigate, context.authentication]);

  return null;
};
