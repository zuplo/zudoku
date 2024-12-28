import { redirect } from "react-router";
import { ZudokuRedirect } from "../../../config/validators/common.js";
import type { ZudokuPlugin } from "../../core/plugins.js";

export const redirectPlugin = (options: {
  redirects: ZudokuRedirect[];
}): ZudokuPlugin => {
  return {
    getRoutes: () =>
      options.redirects.map(({ from, to }) => ({
        path: from,
        loader: () => redirect(to, 301),
      })),
  };
};
