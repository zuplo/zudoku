import { useEffect } from "react";
import { useLatest } from "../../util/useLatest.js";
import { useAuth } from "../hook.js";

export const SignOut = () => {
  const auth = useAuth();

  const logout = useLatest(auth.logout);

  useEffect(() => {
    void logout.current();
  }, [logout]);

  return null;
};
