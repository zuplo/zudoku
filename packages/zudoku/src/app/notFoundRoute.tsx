import { use } from "react";
import type { RouteObject } from "react-router";
import { RenderContext } from "../lib/components/context/RenderContext.js";
import { StatusPage } from "../lib/components/StatusPage.js";

const SsrNotFoundPage = () => {
  const renderContext = use(RenderContext);

  if (typeof window === "undefined" && renderContext.status === 200) {
    renderContext.status = 404;
  }

  return <StatusPage statusCode={404} />;
};

export const notFoundRoute: RouteObject = {
  path: "*",
  element: <SsrNotFoundPage />,
};
