import { useEffect } from "react";
import { useAuth } from "../hook.js";

export const SignOut = () => {
  const auth = useAuth();

  useEffect(() => {
    void auth.logout();
  }, [auth]);

  return null;
};
