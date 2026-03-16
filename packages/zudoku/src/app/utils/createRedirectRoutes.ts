import { redirect, type RouteObject } from "react-router";
import type { ZudokuRedirect } from "../../config/validators/validate.js";
import { joinUrl } from "../../lib/util/joinUrl.js";

export const createRedirectRoutes = (
  redirects: ZudokuRedirect[] = [],
): RouteObject[] =>
  redirects.map((r) => ({
    path: joinUrl(r.from),
    loader: () => redirect(r.to, 301),
  }));
