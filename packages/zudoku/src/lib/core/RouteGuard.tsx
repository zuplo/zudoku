import { Helmet } from "@zudoku/react-helmet-async";
import { use, useCallback, useEffect, useMemo, useRef } from "react";
import { matchPath, Outlet, useBlocker, useLocation } from "react-router";
import { REASON_CODES } from "../../config/validators/reason-codes.js";
import { useAuth } from "../authentication/hook.js";
import { RenderContext } from "../components/context/RenderContext.js";
import { useZudoku } from "../components/context/ZudokuContext.js";
import { Layout } from "../components/Layout.js";
import { ZudokuError } from "../util/invariant.js";

export const SEARCH_PROTECTED_SECTION = "protected";

const BypassRoute = ({ isProtectedRoute }: { isProtectedRoute: boolean }) => (
  <>
    {isProtectedRoute && (
      <Helmet>
        <meta
          name="pagefind"
          data-pagefind-filter={`section:${SEARCH_PROTECTED_SECTION}`}
          content="true"
        />
      </Helmet>
    )}
    <Outlet />
  </>
);

const ForbiddenPage = () => {
  const renderContext = use(RenderContext);
  renderContext.status = 403;

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
      </div>
    </Layout>
  );
};

const RedirectingToLogin = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <p className="text-muted-foreground">Redirecting to login…</p>
  </div>
);

export const RouteGuard = () => {
  const auth = useAuth();
  const zudoku = useZudoku();
  const location = useLocation();
  const renderContext = use(RenderContext);
  const shouldBypass = renderContext.bypassProtection;
  const authCheckContext = useMemo(
    () => ({ auth, context: zudoku, reasonCode: REASON_CODES }),
    [auth, zudoku],
  );
  const { protectedRoutes } = zudoku;

  const getAuthCheck = useCallback(
    (pathname: string) => {
      if (!protectedRoutes) return;
      for (const [pattern, check] of Object.entries(protectedRoutes)) {
        if (matchPath({ path: pattern, end: true }, pathname)) {
          return check;
        }
      }
    },
    [protectedRoutes],
  );

  const currentAuthCheck = getAuthCheck(location.pathname);
  const isProtectedRoute = currentAuthCheck !== undefined;
  const rawResult = currentAuthCheck?.(authCheckContext) ?? true;
  // Normalize: false is equivalent to UNAUTHORIZED
  const authResult =
    rawResult === false ? REASON_CODES.UNAUTHORIZED : rawResult;
  const isForbidden = authResult === REASON_CODES.FORBIDDEN;
  const needsToSignIn = authResult === REASON_CODES.UNAUTHORIZED;

  const blocker = useBlocker(({ nextLocation }) => {
    if (shouldBypass) return false;
    const check = getAuthCheck(nextLocation.pathname);
    if (!check) return false;
    const result = check(authCheckContext);
    // Only block for unauthorized (needs login), not for reason codes like "forbidden"
    return result === false || result === REASON_CODES.UNAUTHORIZED;
  });
  const isBlocked = blocker.state === "blocked";

  // Proceed after successful login (e.g. user authenticated in another tab while we were redirecting)
  useEffect(() => {
    if (!auth.isAuthenticated || !isBlocked) return;
    const check = getAuthCheck(blocker.location.pathname);
    if (!check) {
      blocker.proceed?.();
      return;
    }
    const result = check(authCheckContext);
    // Proceed whenever the result is no longer UNAUTHORIZED (e.g. true or FORBIDDEN)
    if (result !== false && result !== REASON_CODES.UNAUTHORIZED) {
      blocker.proceed?.();
    }
  }, [
    auth.isAuthenticated,
    isBlocked,
    blocker,
    authCheckContext,
    getAuthCheck,
  ]);

  const isUnauthorizedDestination = needsToSignIn || isBlocked;
  const blockerLocation = isBlocked ? blocker.location : null;
  const redirectTo = blockerLocation
    ? blockerLocation.pathname + blockerLocation.search + blockerLocation.hash
    : location.pathname + location.search + location.hash;

  // Auto-redirect to the auth provider when unauthorized.
  // Ref guard prevents duplicate calls if auth.signup's identity changes between renders.
  const redirectInitiatedRef = useRef(false);
  useEffect(() => {
    if (!isUnauthorizedDestination) {
      redirectInitiatedRef.current = false;
      return;
    }
    if (auth.isPending) return;
    if (!auth.isAuthEnabled) return;
    if (shouldBypass) return;
    if (redirectInitiatedRef.current) return;
    redirectInitiatedRef.current = true;
    void auth.signup({ redirectTo });
  }, [
    isUnauthorizedDestination,
    auth.isPending,
    auth.isAuthEnabled,
    auth.signup,
    redirectTo,
    shouldBypass,
  ]);

  if (isForbidden) {
    return <ForbiddenPage />;
  }

  if (shouldBypass) {
    return <BypassRoute isProtectedRoute={isProtectedRoute} />;
  }

  if (isProtectedRoute && !auth.isAuthEnabled) {
    throw new ZudokuError("Authentication is not enabled", {
      title: "Authentication is not enabled",
      developerHint:
        "To use protectedRoutes you need authentication to be enabled",
    });
  }

  if (
    isUnauthorizedDestination &&
    auth.isPending &&
    typeof window !== "undefined"
  ) {
    return null;
  }

  if (isUnauthorizedDestination) {
    return <RedirectingToLogin />;
  }

  return <Outlet />;
};
