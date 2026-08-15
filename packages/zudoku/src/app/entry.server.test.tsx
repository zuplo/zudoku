import { use } from "react";
import { Outlet, type RouteObject } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { RenderContext } from "../lib/components/context/RenderContext.js";

vi.mock("virtual:zudoku-auth", () => ({
  configuredAuthProvider: undefined,
}));

vi.mock("virtual:zudoku-config", () => ({
  default: {},
}));

vi.mock("virtual:zudoku-shiki-register", () => ({
  registerShiki: vi.fn(),
}));

vi.mock("../lib/shiki.js", () => ({
  highlighterPromise: Promise.resolve({}),
}));

vi.mock("../lib/manifest.js", () => ({
  buildManifest: () => ({ auth: { sessionEndpoint: "/auth/session" } }),
}));

vi.mock("./main.js", () => ({
  getRoutesByConfig: vi.fn(),
}));

vi.mock("../lib/components/StatusPage.js", () => ({
  StatusPage: () => <main>Not found</main>,
}));

const { handleRequest } = await import("./entry.server.js");
const { notFoundRoute } = await import("./notFoundRoute.js");

const template =
  "<!doctype html><html><head></head><body><!--app-html--></body></html>";

const ExistingStatus = ({ status }: { status: number }) => {
  const renderContext = use(RenderContext);
  renderContext.status = status;
  return <Outlet />;
};

const routes: RouteObject[] = [
  { path: "/", element: <main>Home</main> },
  { path: "/404", element: <main>Explicit status page</main> },
  {
    path: "/protected",
    element: <ExistingStatus status={401} />,
    children: [notFoundRoute],
  },
  notFoundRoute,
];

const renderPath = (path: string) =>
  handleRequest({
    template,
    request: new Request(`http://localhost${path}`),
    routes,
  });

describe("handleRequest", () => {
  it.each([
    {
      path: "/",
      status: 200,
      cacheControl: "public, max-age=0, s-maxage=60, must-revalidate",
    },
    {
      path: "/404",
      status: 200,
      cacheControl: "public, max-age=0, s-maxage=60, must-revalidate",
    },
    { path: "/missing", status: 404, cacheControl: null },
    { path: "/protected/missing", status: 401, cacheControl: null },
  ])("returns $status for $path", async ({ path, status, cacheControl }) => {
    const response = await renderPath(path);

    expect(response.status).toBe(status);
    expect(response.headers.get("Cache-Control")).toBe(cacheControl);
  });
});
