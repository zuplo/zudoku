import type { NavigateFunction } from "react-router";
import { joinUrl } from "../../util/joinUrl.js";
import { waitForSessionSync } from "../cookie-sync.js";

// Send the user to the post-login target. SSR hard-navigates (after the cookie
// sync) for a fresh authed render; BASE_URL is resolved to a same-origin path
// first since it can be an absolute CDN URL. SSG navigates client-side.
export const redirectAfterAuth = async (
  navigate: NavigateFunction,
  url: string,
  { replace = false }: { replace?: boolean } = {},
): Promise<void> => {
  if (import.meta.env.ZUDOKU_HAS_SERVER) {
    await waitForSessionSync();
    const { pathname } = new URL(
      import.meta.env.BASE_URL,
      window.location.origin,
    );
    const target = joinUrl(pathname, url);
    if (replace) window.location.replace(target);
    else window.location.assign(target);
    return;
  }
  void navigate(url, { replace });
};
