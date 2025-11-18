import { Helmet } from "@zudoku/react-helmet-async";
import { use } from "react";
import { matchPath, Outlet, useLocation, useNavigate } from "react-router";
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
import { useLatest } from "../util/useLatest.js";

export const SEARCH_PROTECTED_SECTION = "protected";

export const RouteGuard = () => {
  const auth = useAuth();
  const zudoku = useZudoku();
  const navigate = useNavigate();
  const location = useLocation();
  const latestPath = useLatest(location.pathname);
  const shouldBypass = use(BypassProtectedRoutesContext);
  const { protectedRoutes } = zudoku.options;

  const authCheckFn =
    !shouldBypass && protectedRoutes
      ? Object.entries(protectedRoutes).find(([path]) =>
          matchPath({ path, end: true }, location.pathname),
        )?.[1]
      : undefined;

  const isProtectedRoute = authCheckFn !== undefined;
  const needsToSignIn =
    isProtectedRoute && !authCheckFn({ auth, context: zudoku });

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

  if (needsToSignIn) {
    return (
      <Dialog
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            void navigate(-1);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login to continue</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Please wait while we log you in.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => void navigate(-1)}>
              Cancel
            </Button>
            <div className="w-full"></div>
            <Button
              variant="secondary"
              onClick={() =>
                void zudoku.authentication?.signUp(
                  { navigate },
                  { redirectTo: latestPath.current },
                )
              }
            >
              Register
            </Button>
            <Button
              onClick={() =>
                void zudoku.authentication?.signIn(
                  { navigate },
                  { redirectTo: latestPath.current },
                )
              }
            >
              Login{" "}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {shouldBypass && (
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
};
