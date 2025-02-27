import { useQuery } from "@tanstack/react-query";
import { matchPath, Outlet, useLocation, useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "zudoku/ui/Dialog.js";
import { useAuth } from "../authentication/hook.js";
import { useZudoku } from "../components/context/ZudokuContext.js";
import { ZudokuError } from "../util/invariant.js";
import { useLatest } from "../util/useLatest.js";

export const RouteGuard = () => {
  const auth = useAuth();
  const zudoku = useZudoku();
  const navigate = useNavigate();
  const location = useLocation();
  const latestPath = useLatest(location.pathname);

  const isProtected = zudoku.options.protectedRoutes?.some((path) =>
    matchPath({ path, end: true }, location.pathname),
  );

  useQuery({
    queryKey: ["login-redirect"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return zudoku.authentication?.signIn({
        redirectTo: latestPath.current,
      });
    },
    enabled:
      typeof window !== "undefined" &&
      isProtected &&
      !auth.isPending &&
      !auth.isAuthenticated,
  });

  if (isProtected && !auth.isAuthenticated) {
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
            <DialogTitle>Logging you in...</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Please wait while we log you in.
          </DialogDescription>
        </DialogContent>
      </Dialog>
    );
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
