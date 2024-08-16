import { redirect } from "react-router-dom";
import type { DevPortalPlugin } from "../../core/plugins.js";

export type Redirect = {
  from: string;
  to: string;
};

export const redirectPlugin = (options: {
  redirects: Redirect[];
}): DevPortalPlugin => {
  return {
    getRoutes: () =>
      options.redirects.map(({ from, to }) => ({
        path: from,
        loader: () => redirect(to),
      })),
  };
};
