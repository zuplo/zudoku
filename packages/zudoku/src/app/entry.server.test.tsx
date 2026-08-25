import { use } from "react";
import { Outlet, type RouteObject } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { RenderContext } from "../lib/components/context/RenderContext.js";
import { useCurrentNavigation } from "../lib/components/context/ZudokuContext.js";
import { Layout } from "../lib/components/Layout.js";
import { Zudoku } from "../lib/components/Zudoku.js";

const navigationMocks = vi.hoisted(() => ({
  getNavigation: vi.fn(() =>
    Promise.resolve([
      { type: "link" as const, label: "API reference", to: "/reference" },
    ]),
  ),
  initialize: vi.fn(),
}));

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
  convertZudokuConfigToOptions: () => ({
    plugins: [
      {
        getNavigation: navigationMocks.getNavigation,
        getRoutes: () => [],
        initialize: navigationMocks.initialize,
      },
    ],
  }),
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

const AsyncPluginNavigation = () => {
  const { navigation, isPending } = useCurrentNavigation();

  return (
    <main>
      <nav>
        {isPending
          ? "Loading navigation"
          : navigation.map((item) => item.label).join(", ")}
      </nav>
      <article>API documentation</article>
    </main>
  );
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

  it("preserves async plugin navigation in HTML and dehydrated state", async () => {
    const response = await handleRequest({
      template,
      request: new Request("http://localhost/"),
      routes: [
        {
          path: "/",
          element: (
            <Zudoku
              plugins={[
                {
                  getNavigation: navigationMocks.getNavigation,
                  getRoutes: () => [],
                },
              ]}
            >
              <Layout>
                <AsyncPluginNavigation />
              </Layout>
            </Zudoku>
          ),
        },
      ],
    });
    const html = await response.text();
    const serializedState = html.match(
      /window\.ZUDOKU_DATA=([\s\S]*?)<\/script>/,
    )?.[1];

    expect(html).toContain("<nav>API reference</nav>");
    expect(html).toContain("<article>API documentation</article>");
    expect(html).not.toContain("Loading navigation");
    expect(html).not.toContain('<div hidden id="S:');
    expect(html).not.toContain("$RC(");
    expect(serializedState).toBeDefined();

    const dehydratedState = JSON.parse(serializedState ?? "{}");
    expect(dehydratedState.queries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          queryKey: ["plugin-navigation", "/", false],
          state: expect.objectContaining({
            data: [
              {
                type: "link",
                label: "API reference",
                to: "/reference",
              },
            ],
          }),
        }),
      ]),
    );
  });

  it("prefetches navigation with the router-relative path under a base path", async () => {
    navigationMocks.getNavigation.mockClear();

    const response = await handleRequest({
      template,
      request: new Request("http://localhost/docs/guide"),
      basePath: "/docs",
      routes: [
        {
          path: "/guide",
          element: (
            <Zudoku
              plugins={[
                {
                  getNavigation: navigationMocks.getNavigation,
                  getRoutes: () => [],
                },
              ]}
            >
              <Layout>
                <AsyncPluginNavigation />
              </Layout>
            </Zudoku>
          ),
        },
      ],
    });
    const html = await response.text();

    expect(navigationMocks.getNavigation).toHaveBeenCalledTimes(1);
    expect(navigationMocks.getNavigation).toHaveBeenCalledWith(
      "/guide",
      expect.anything(),
    );
    expect(html).toContain("<nav>API reference</nav>");
    expect(html).not.toContain("Loading navigation");
    expect(html).not.toContain('<div hidden id="S:');
    expect(html).not.toContain("$RC(");
    expect(html).toContain('"queryKey":["plugin-navigation","/guide",false]');
  });

  it("returns an HTML 500 when plugin initialization throws synchronously", async () => {
    navigationMocks.initialize.mockImplementationOnce(() => {
      throw new Error("Plugin initialization failed");
    });

    const response = await renderPath("/");
    const html = await response.text();

    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).toBe(
      "text/html; charset=utf-8",
    );
    expect(html).toContain("Error: Plugin initialization failed");
  });
});
