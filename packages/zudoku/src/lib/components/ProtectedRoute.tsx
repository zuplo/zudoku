import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../authentication/hook.js";
import { DeveloperHint } from "../components/DeveloperHint.js";
import { Button } from "../ui/Button.js";

export const ProtectedRoute = () => {
  const auth = useAuth();
  const location = useLocation();

  // TODO: should we suspend here somehow?
  if (auth.isAuthEnabled && auth.isPending) {
    return null;
  }

  if (/oauth\/callback|signin|signout|signup/.test(location.pathname))
    return <Outlet />;

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
      <h1 className="mt-2 text-4xl font-extrabold">
        Please login first to view this page
      </h1>
      <Button onClick={() => auth.login()}>Login</Button>
    </div>
  );
};
