import type { NavigateFunction } from "react-router";
import { joinUrl } from "../../util/joinUrl.js";
import { waitForSessionSync } from "../cookie-sync.js";

// Send the user to the post-login target. In SSR the protected route's chunk is
// server-gated by the auth cookie, so hard-navigate (once the cookie sync
// settles) for a fresh authed render; prepend the base since a hard nav ignores
// the router basename. SSG navigates client-side.
export const redirectAfterAuth = async (
  navigate: NavigateFunction,
  url: string,
  { replace = false }: { replace?: boolean } = {},
): Promise<void> => {
  if (import.meta.env.ZUDOKU_HAS_SERVER) {
    await waitForSessionSync();
    const target = joinUrl(import.meta.env.BASE_URL, url);
    if (replace) window.location.replace(target);
    else window.location.assign(target);
    return;
  }
  void navigate(url, { replace });
};
