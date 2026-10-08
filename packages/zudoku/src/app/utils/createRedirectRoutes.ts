import { redirect, type RouteObject } from "react-router";
import type { ZudokuRedirect } from "../../config/validators/ZudokuConfig.js";
import { joinUrl } from "../../lib/util/joinUrl.js";
import { resolveRedirectTarget } from "../../lib/util/redirectPattern.js";

export const createRedirectRoutes = (
  redirects?: ZudokuRedirect[],
): RouteObject[] =>
  (redirects ?? []).map((r) => ({
    path: joinUrl(r.from),
    loader: ({ params }) => redirect(resolveRedirectTarget(r, params), 301),
  }));
