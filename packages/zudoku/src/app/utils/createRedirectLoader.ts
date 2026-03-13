import { redirect } from "react-router";
import type { ZudokuRedirect } from "../../config/validators/validate.js";
import { joinUrl } from "../../lib/util/joinUrl.js";

export const createRedirectLoader = (
  redirects?: ZudokuRedirect[],
  basePath?: string,
) => {
  if (!redirects) return undefined;

  const prefix = basePath ? joinUrl(basePath) : "";
  const map = new Map(redirects.map((r) => [joinUrl(r.from), r.to]));
  return ({ request }: { request: Request }) => {
    let pathname = joinUrl(new URL(request.url).pathname);
    if (prefix && pathname.startsWith(prefix)) {
      pathname = pathname.slice(prefix.length) || "/";
    }
    const to = map.get(joinUrl(pathname));
    return to ? redirect(to, 301) : null;
  };
};
