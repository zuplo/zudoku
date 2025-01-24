import { useEffect } from "react";
import { matchPath, Outlet, useLocation } from "react-router";
import { useAuth } from "../authentication/hook.js";
import { useZudoku } from "../components/context/ZudokuContext.js";
import { ZudokuError } from "../util/invariant.js";

export const RouteGuard = () => {
  const auth = useAuth();
  const zudoku = useZudoku();
  const location = useLocation();

  const isProtected = zudoku.options.protectedRoutes?.some((path) =>
    matchPath({ path, end: true }, location.pathname),
  );

  useEffect(() => {
    if (isProtected && !auth.isAuthenticated) {
      void zudoku.authentication?.signIn();
    }
  }, [isProtected, auth.isAuthenticated, zudoku.authentication]);

  if (isProtected && !auth.isAuthenticated) {
    return null;
  }

  if (isProtected && !auth.isAuthEnabled) {
    throw new ZudokuError("Authentication is not enabled", {
      title: "Authentication is not enabled",
      developerHint:
        "To use protectedRoutes you need authentication to be enabled",
    });
  }

  return <Outlet />;
};
