import { minimatch } from "minimatch";
import { useEffect } from "react";
import { useLocation } from "react-router";
import { useAuth } from "../authentication/hook.js";
import { useZudoku } from "../components/context/ZudokuContext.js";
import { ZudokuError } from "../util/invariant.js";

export function isProtectedRoute(
  path: string,
  protectedPatterns?: string[],
): boolean {
  if (!protectedPatterns?.length) return false;
  return protectedPatterns.some((pattern) => minimatch(path, pattern));
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const zudoku = useZudoku();
  const location = useLocation();

  const isProtected = isProtectedRoute(
    location.pathname,
    zudoku.options.protectedRoutes,
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

  return children;
}
