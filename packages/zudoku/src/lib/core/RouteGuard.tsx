import { Helmet } from "@zudoku/react-helmet-async";
import { use, useCallback, useEffect, useMemo } from "react";
import { matchPath, Outlet, useBlocker, useLocation } from "react-router";
import { Button } from "zudoku/ui/Button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "zudoku/ui/Dialog.js";
import { REASON_CODES } from "../../config/validators/reason-codes.js";
import { useAuth } from "../authentication/hook.js";
import { RenderContext } from "../components/context/RenderContext.js";
import { useZudoku } from "../components/context/ZudokuContext.js";
import { Layout } from "../components/Layout.js";
import { ZudokuError } from "../util/invariant.js";

export const SEARCH_PROTECTED_SECTION = "protected";

export type LoginDialogProps = {
  open: boolean;
  onCancel: () => void;
  onLogin: () => void;
  onRegister: () => void;
};

export const LoginDialog = ({
  open,
  onCancel,
  onLogin,
  onRegister,
}: LoginDialogProps) => (
  <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Login to continue</DialogTitle>
      </DialogHeader>
      <DialogDescription>Please login to access this page.</DialogDescription>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="w-full" />
        <Button variant="secondary" onClick={onRegister}>
          Register
        </Button>
        <Button onClick={onLogin}>Login</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

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

// Inline sign-in prompt for initial page loads. Not a Dialog because those
// portal to document.body and would leave SSR output empty.
export const SignInRequiredPage = ({ redirectTo }: { redirectTo: string }) => {
  const auth = useAuth();
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">Sign in to continue</h1>
        <p className="text-muted-foreground">
          Please sign in to access this page.
        </p>
        <div className="flex gap-2">
          <Button onClick={() => void auth.login({ redirectTo })}>
            Sign in
          </Button>
          {auth.isAuthEnabled && (
            <Button
              variant="outline"
              onClick={() => void auth.signup({ redirectTo })}
            >
              Register
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

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
  // Fail-closed: an unprotected route returns true; a protected route whose
  // check returns undefined is treated as UNAUTHORIZED, not authorized.
  const rawResult = isProtectedRoute
    ? (currentAuthCheck(authCheckContext) ?? REASON_CODES.UNAUTHORIZED)
    : true;
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

  if (isForbidden) return <ForbiddenPage />;
  if (shouldBypass) return <BypassRoute isProtectedRoute={isProtectedRoute} />;

  if (isProtectedRoute && !auth.isAuthEnabled) {
    throw new ZudokuError("Authentication is not enabled", {
      title: "Authentication is not enabled",
      developerHint:
        "To use protectedRoutes you need authentication to be enabled",
    });
  }

  if (needsToSignIn) {
    if (typeof window === "undefined") renderContext.status = 401;
    if (auth.isPending) return null;
    return (
      <SignInRequiredPage redirectTo={location.pathname + location.search} />
    );
  }

  const redirectTo =
    blocker.location?.pathname != null
      ? blocker.location.pathname + blocker.location.search
      : location.pathname + location.search;

  return (
    <>
      <Outlet />
      <LoginDialog
        open={isBlocked}
        onCancel={() => blocker.reset?.()}
        onLogin={() => void auth.login({ redirectTo })}
        onRegister={() => void auth.signup({ redirectTo })}
      />
    </>
  );
};
