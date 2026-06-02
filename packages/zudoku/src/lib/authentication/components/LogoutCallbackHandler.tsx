import { useEffect } from "react";
import { useNavigate } from "react-router";

export function LogoutCallbackHandler({
  handleLogoutCallback,
}: {
  handleLogoutCallback: () => string;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectTo = handleLogoutCallback();
    navigate(redirectTo, { replace: true });
  }, [handleLogoutCallback, navigate]);

  return null;
}
