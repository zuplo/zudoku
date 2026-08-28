import { Suspense, use } from "react";
import { Outlet, type RouteObject } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RenderContext } from "../lib/components/context/RenderContext.js";

vi.mock("virtual:zudoku-auth", () => ({
  configuredAuthProvider: undefined,
}));

vi.mock("virtual:zudoku-config", () => ({
  default: {
    docs: {
      publishMarkdown: true,
      contentNegotiation: true,
      llms: { llmsTxt: true },
    },
    sitemap: { siteUrl: "https://example.com" },
  },
}));

vi.mock("virtual:zudoku-markdown-files", () => ({
  default: { "/": "# Home\n\nWelcome." },
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

const DeferredContent = ({ content }: { content: Promise<string> }) => (
  <section>{use(content)}</section>
);

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

const renderPath = (
  path: string,
  { accept, method }: { accept?: string; method?: string } = {},
) =>
  handleRequest({
    template,
    request: new Request(`http://localhost${path}`, {
      method,
      headers: accept ? { Accept: accept } : undefined,
    }),
    routes,
  });

describe("handleRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  it("serves a Markdown representation from the canonical URL", async () => {
    const response = await renderPath("/", { accept: "text/markdown" });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("Vary")).toBe("Accept");
    expect(response.headers.get("Link")).toBe(
      '</index.md>; rel="alternate"; type="text/markdown"',
    );
    await expect(response.text()).resolves.toBe("# Home\n\nWelcome.");
  });

  it("advertises the Markdown variant on the HTML response", async () => {
    const response = await renderPath("/", { accept: "text/html" });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/html; charset=utf-8",
    );
    expect(response.headers.get("Vary")).toBe("Accept");
    expect(response.headers.get("Link")).toBe(
      '</index.md>; rel="alternate"; type="text/markdown"',
    );
  });

  it("returns a recoverable Markdown 404", async () => {
    const response = await renderPath("/missing", {
      accept: "text/markdown",
    });
    const body = await response.text();

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("Vary")).toBe("Accept");
    expect(body).toContain("# Page not found");
    expect(body).toContain("[Markdown documentation index](/index.md)");
    expect(body).toContain("[Agent documentation index](/llms.txt)");
    expect(body).toContain("[Sitemap](/sitemap.xml)");
  });

  it("does not advertise SSG-only indexes from an SSR deployment", async () => {
    vi.stubEnv("ZUDOKU_HAS_SERVER", "true");
    const response = await renderPath("/missing", {
      accept: "text/markdown",
    });
    const body = await response.text();

    expect(response.status).toBe(404);
    expect(body).toContain("[Markdown documentation index](/index.md)");
    expect(body).not.toContain("llms.txt");
    expect(body).not.toContain("sitemap.xml");
  });

  it("returns 406 when neither representation is acceptable", async () => {
    const response = await renderPath("/", { accept: "application/json" });

    expect(response.status).toBe(406);
    expect(response.headers.get("Vary")).toBe("Accept");
  });

  it("returns Markdown headers without a body for HEAD", async () => {
    const response = await renderPath("/", {
      accept: "text/markdown",
      method: "HEAD",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    await expect(response.text()).resolves.toBe("");
  });

  it("returns HTML headers without a body for HEAD", async () => {
    const response = await renderPath("/", {
      accept: "text/html",
      method: "HEAD",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/html; charset=utf-8",
    );
    expect(response.headers.get("Vary")).toBe("Accept");
    await expect(response.text()).resolves.toBe("");
  });

  it("serializes large completed Suspense content before following siblings", async () => {
    const content = `Resolved content ${"x".repeat(20_000)}`;
    const deferredContent = new Promise<string>((resolve) => {
      setTimeout(() => resolve(content), 5);
    });
    const response = await handleRequest({
      template,
      request: new Request("http://localhost/", {
        headers: { Accept: "text/html" },
      }),
      routes: [
        {
          path: "/",
          element: (
            <>
              <Suspense fallback={<main>Outer loading</main>}>
                <main>
                  <Suspense fallback="Inner loading">
                    <DeferredContent content={deferredContent} />
                  </Suspense>
                </main>
              </Suspense>
              <footer>Footer</footer>
            </>
          ),
        },
      ],
    });
    const html = await response.text();

    expect(html).toContain(content);
    expect(html.indexOf("Resolved content")).toBeLessThan(
      html.indexOf("<footer>"),
    );
    expect(html).not.toContain("loading");
    expect(html).not.toContain("<!--$?-->");
    expect(html).not.toContain('<template id="B:');
    expect(html).not.toContain('hidden id="S:');
    expect(html).not.toContain("$RC(");
  });
});
