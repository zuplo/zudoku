import {
  isRouteErrorResponse,
  matchPath,
  useLocation,
  useRouteError,
} from "react-router";
import { useAuth } from "../authentication/hook.js";
import { useZudoku } from "../components/context/ZudokuContext.js";
import { NotFoundPage } from "../components/NotFoundPage.js";
import { SignInRequiredPage } from "../core/RouteGuard.js";
import { cn } from "../util/cn.js";
import { ErrorAlert } from "./ErrorAlert.js";

// Chunk-load failure shape (what lazy() rejects with when protectedAssets
// serves a 401). Matches the three browser messages plus the webpack-style
// ChunkLoadError name.
const isChunkLoadError = (error: unknown): boolean =>
  error instanceof Error &&
  (error.name === "ChunkLoadError" ||
    /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/.test(
      error.message,
    ));

// Safety net when a lazy() rejection trips errorElement instead of
// RouteGuard (session expired mid-nav, etc.). Only fires for errors that
// look like chunk-load failures or an explicit 401 route response so
// genuine errors on protected routes still surface.
const useSignInPromptIfProtectedUnauth = (error: unknown) => {
  const location = useLocation();
  const auth = useAuth();
  const { protectedRoutes } = useZudoku();
  if (!protectedRoutes || !auth.isAuthEnabled) return null;
  if (auth.isAuthenticated || auth.isPending) return null;

  const isAuthError =
    (isRouteErrorResponse(error) && error.status === 401) ||
    isChunkLoadError(error);

  if (!isAuthError) return null;

  const isProtected = Object.keys(protectedRoutes).some(
    (p) => matchPath({ path: p, end: false }, location.pathname) != null,
  );
  if (!isProtected) return null;

  return (
    <SignInRequiredPage redirectTo={location.pathname + location.search} />
  );
};

export function RouterError({ className }: { className?: string }) {
  const error = useRouteError();
  const signInPrompt = useSignInPromptIfProtectedUnauth(error);

  if (signInPrompt) return signInPrompt;

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  return (
    <div className={cn("mx-4 max-w-2xl", className)} data-pagefind-ignore="all">
      <ErrorAlert error={error} />
    </div>
  );
}
