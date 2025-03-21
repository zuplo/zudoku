import { Outlet } from "react-router";
import { useAuth } from "../../authentication/hook.js";
import { DeveloperHint } from "../../components/DeveloperHint.js";
import { Button } from "../../ui/Button.js";

export const ProtectedRoute = () => {
  const auth = useAuth();

  // TODO: should we suspend here somehow?
  if (auth.isAuthEnabled && auth.isPending) {
    return null;
  }

  return auth.isAuthenticated ? (
    <Outlet />
  ) : !auth.isAuthEnabled ? (
    <div className="flex flex-col justify-center gap-2 items-center h-1/2">
      <DeveloperHint className="max-w-[600px]">
        Authentication needs to be enabled for API keys to work. Enable it in
        your Zudoku configuration under <code>authentication</code>.
      </DeveloperHint>
    </div>
  ) : (
    <div className="flex flex-col justify-center gap-2 items-center h-1/2">
      Please login first to view this page
      <Button onClick={() => auth.login()}>Login</Button>
    </div>
  );
};
