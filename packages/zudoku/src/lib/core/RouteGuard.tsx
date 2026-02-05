import { Helmet } from "@zudoku/react-helmet-async";
import { use, useCallback, useEffect, useMemo } from "react";
import {
  matchPath,
  Outlet,
  useBlocker,
  useLocation,
  useNavigate,
} from "react-router";
import { Button } from "zudoku/ui/Button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "zudoku/ui/Dialog.js";
import { useAuth } from "../authentication/hook.js";
import { BypassProtectedRoutesContext } from "../components/context/BypassProtectedRoutesContext.js";
import { useZudoku } from "../components/context/ZudokuContext.js";
import { ZudokuError } from "../util/invariant.js";

export const SEARCH_PROTECTED_SECTION = "protected";

type LoginDialogProps = {
  open: boolean;
  onCancel: () => void;
  onLogin: () => void;
  onRegister: () => void;
};

const LoginDialog = ({
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

export const RouteGuard = () => {
  const auth = useAuth();
  const zudoku = useZudoku();
  const navigate = useNavigate();
  const location = useLocation();
  const shouldBypass = use(BypassProtectedRoutesContext);
  const authCheckContext = useMemo(
    () => ({ auth, context: zudoku }),
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
  const isAuthorized = currentAuthCheck?.(authCheckContext) ?? true;
  const needsToSignIn = isProtectedRoute && !isAuthorized;

  const blocker = useBlocker(({ nextLocation }) => {
    if (shouldBypass) return false;
    const check = getAuthCheck(nextLocation.pathname);
    return check !== undefined && !check(authCheckContext);
  });
  const isBlocked = blocker.state === "blocked";
  const intendedPath = isBlocked ? blocker.location.pathname : undefined;

  // Proceed after successful login
  useEffect(() => {
    if (!auth.isAuthenticated || !intendedPath) return;
    const check = getAuthCheck(intendedPath);
    if (!check || check(authCheckContext)) {
      blocker.proceed?.();
    }
  }, [
    auth.isAuthenticated,
    intendedPath,
    blocker,
    authCheckContext,
    getAuthCheck,
  ]);

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

  if (needsToSignIn && auth.isPending && typeof window !== "undefined") {
    return null;
  }

  const showDialog = needsToSignIn || isBlocked;
  const redirectTo = intendedPath ?? location.pathname;

  return (
    <>
      {!needsToSignIn && <Outlet />}
      <LoginDialog
        open={showDialog}
        onCancel={needsToSignIn ? () => navigate(-1) : () => blocker.reset?.()}
        onLogin={() => void auth.login({ redirectTo })}
        onRegister={() => void auth.signup({ redirectTo })}
      />
    </>
  );
};
