import { redirect } from "react-router";
import type { ZudokuRedirect } from "../../config/validators/validate.js";
import { joinUrl } from "../../lib/util/joinUrl.js";

export const createRedirectLoader = (redirects?: ZudokuRedirect[]) => {
  if (!redirects) return undefined;

  const map = new Map(redirects.map((r) => [joinUrl(r.from), r.to]));
  return ({ request }: { request: Request }) => {
    const to = map.get(joinUrl(new URL(request.url).pathname));
    return to ? redirect(to, 301) : null;
  };
};
