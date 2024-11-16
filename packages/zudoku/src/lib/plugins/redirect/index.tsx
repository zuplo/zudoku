import { redirect } from "react-router-dom";
import { ZudokuRedirect } from "../../../config/validators/validate.js";
import type { DevPortalPlugin } from "../../core/plugins.js";

export const redirectPlugin = (options: {
  redirects: ZudokuRedirect[];
}): DevPortalPlugin => {
  return {
    getRoutes: () =>
      options.redirects.map(({ from, to }) => ({
        path: from,
        loader: () => redirect(to, 301),
      })),
  };
};
