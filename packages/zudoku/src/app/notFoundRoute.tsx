import { use } from "react";
import type { RouteObject } from "react-router";
import {
  RenderContext,
  setSsrStatus,
} from "../lib/components/context/RenderContext.js";
import { StatusPage } from "../lib/components/StatusPage.js";

const SsrNotFoundPage = () => {
  const renderContext = use(RenderContext);

  // Statuses set by outer routes (e.g. auth guards) take precedence
  setSsrStatus(renderContext, 404, { onlyIfUnset: true });

  return <StatusPage statusCode={404} />;
};

export const notFoundRoute: RouteObject = {
  path: "*",
  element: <SsrNotFoundPage />,
};
