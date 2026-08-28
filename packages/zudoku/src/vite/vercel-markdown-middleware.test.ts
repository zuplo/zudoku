import { describe, expect, it } from "vitest";
import { negotiateContentType } from "../lib/util/contentNegotiation.js";
import { generateVercelMarkdownMiddleware } from "./vercel-markdown-middleware.js";

type Middleware = (request: Request) => Response | Promise<Response>;

const loadMiddleware = async ({
  basePath,
  knownCanonicalRoutePaths = ["/", "/guide", "/custom"],
  markdownCanonicalRoutePaths = ["/", "/guide"],
  passthroughPaths,
}: {
  basePath?: string;
  knownCanonicalRoutePaths?: string[];
  markdownCanonicalRoutePaths?: string[];
  passthroughPaths?: string[];
} = {}): Promise<Middleware> => {
  const source = generateVercelMarkdownMiddleware({
    basePath,
    knownCanonicalRoutePaths,
    markdownCanonicalRoutePaths,
    markdownNotFoundBody: "# Page not found\n\n- [Documentation home](/docs)\n",
    passthroughPaths,
  });
  const encodedSource = encodeURIComponent(source);
  const module = await import(`data:text/javascript,${encodedSource}`);
  return module.default;
};

const request = (
  pathname: string,
  { accept, method = "GET" }: { accept?: string; method?: string } = {},
) =>
  new Request(`https://example.com${pathname}`, {
    method,
    headers: accept ? { Accept: accept } : undefined,
  });

describe("generateVercelMarkdownMiddleware", () => {
  it("passes HTML through with negotiation and alternate headers", async () => {
    const middleware = await loadMiddleware();
    const response = await middleware(request("/guide?source=test"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.headers.get("Vary")).toBe("Accept, Accept-Encoding");
    expect(response.headers.get("Link")).toBe(
      '</guide.md>; rel="alternate"; type="text/markdown"',
    );
  });

  it("rewrites Markdown requests to the generated sibling", async () => {
    const middleware = await loadMiddleware();
    const response = await middleware(
      request("/guide?source=test", { accept: "text/markdown" }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://example.com/guide.md?source=test",
    );
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("Vary")).toBe("Accept, Accept-Encoding");
    expect(response.headers.get("Link")).toBe(
      '</guide.md>; rel="alternate"; type="text/markdown"',
    );
    expect(await response.text()).toBe("");
  });

  it("uses index.md for the documentation root", async () => {
    const middleware = await loadMiddleware({ basePath: "/docs/" });

    for (const pathname of ["/docs", "/docs/"]) {
      const response = await middleware(
        request(pathname, { accept: "text/markdown" }),
      );
      expect(response.headers.get("x-middleware-rewrite")).toBe(
        "https://example.com/docs/index.md",
      );
      expect(response.headers.get("Link")).toBe(
        '</docs/index.md>; rel="alternate"; type="text/markdown"',
      );
    }
  });

  it.each([
    ["/hello world", "/hello%20world.md"],
    ["/guides/café", "/guides/caf%C3%A9.md"],
    ["/api/1.0.0", "/api/1.0.0.md"],
  ])("URL-encodes the Markdown route for %s", async (routePath, expected) => {
    const middleware = await loadMiddleware({
      knownCanonicalRoutePaths: [routePath],
      markdownCanonicalRoutePaths: [routePath],
    });
    const requestPath = new URL(routePath, "https://example.com").pathname;
    const response = await middleware(
      request(requestPath, { accept: "text/markdown" }),
    );

    expect(
      new URL(response.headers.get("x-middleware-rewrite") ?? "").pathname,
    ).toBe(expected);
    expect(response.headers.get("Link")).toBe(
      `<${expected}>; rel="alternate"; type="text/markdown"`,
    );
  });

  it("honors quality, wildcards, specificity, and q=0 exclusions", async () => {
    const middleware = await loadMiddleware();

    const markdown = await middleware(
      request("/guide", {
        accept: "text/html;q=0.5, text/markdown;q=0.6",
      }),
    );
    expect(markdown.headers.get("x-middleware-rewrite")).toBe(
      "https://example.com/guide.md",
    );

    const html = await middleware(
      request("/guide", { accept: "text/markdown;q=0, */*;q=1" }),
    );
    expect(html.headers.get("x-middleware-next")).toBe("1");
    expect(html.headers.get("x-middleware-rewrite")).toBeNull();

    const explicitMarkdown = await middleware(
      request("/guide", { accept: "*/*, text/markdown" }),
    );
    expect(explicitMarkdown.headers.get("x-middleware-rewrite")).toBe(
      "https://example.com/guide.md",
    );
  });

  it.each([
    undefined,
    "",
    "*/*",
    "text/*",
    "text/html",
    "text/markdown",
    "TEXT/MARKDOWN",
    "text/markdown; charset=utf-8",
    "text/markdown;q=0.9, text/html;q=0.8",
    "text/markdown;q=0, */*;q=1",
    "text/html;q=0, */*;q=1",
    "text/*;q=0, text/markdown;q=0.5",
    "*/*, text/markdown",
    "application/json",
    "text/html;q=0, text/markdown;q=0",
    "text/markdown; charset=iso-8859-1",
    "text/markdown;q=2, text/html;q=0.5",
    'text/markdown; profile="example,profile";q=1, text/html;q=0.5',
  ])("keeps generated negotiation in sync for %j", async (accept) => {
    const middleware = await loadMiddleware();
    const response = await middleware(request("/guide", { accept }));
    const actual =
      response.status === 406
        ? null
        : response.headers.has("x-middleware-rewrite")
          ? "text/markdown"
          : "text/html";

    expect(actual).toBe(negotiateContentType(accept));
  });

  it.each([
    ["text/markdown;q=0.9;charset=utf-8, text/html;q=0.5", "text/markdown"],
    ["text/markdown;charset=utf-8;q=0.9, text/html;q=0.5", "text/markdown"],
    ["text/markdown;q=0.9;charset=iso-8859-1, text/html;q=0.5", "text/html"],
    ["text/markdown;q=0.9;legacy-extension, text/html;q=0.5", "text/html"],
  ])(
    "matches shared RFC 9110 parameter handling for %j",
    async (accept, expected) => {
      const middleware = await loadMiddleware();
      const response = await middleware(request("/guide", { accept }));
      const actual = response.headers.has("x-middleware-rewrite")
        ? "text/markdown"
        : "text/html";

      expect(actual).toBe(expected);
      expect(actual).toBe(negotiateContentType(accept));
    },
  );

  it.each([
    ["/tracking", "/track%69ng", "/tracking.md"],
    ["/guides/café", "/guides/caf%c3%a9", "/guides/caf%C3%A9.md"],
  ])(
    "canonicalizes encoded request route %s",
    async (routePath, requestPath, expectedMarkdownPath) => {
      const middleware = await loadMiddleware({
        knownCanonicalRoutePaths: [routePath],
        markdownCanonicalRoutePaths: [routePath],
      });
      const response = await middleware(
        request(requestPath, { accept: "text/markdown" }),
      );

      expect(
        new URL(response.headers.get("x-middleware-rewrite") ?? "").pathname,
      ).toBe(expectedMarkdownPath);
    },
  );

  it("does not decode an encoded reserved delimiter into a route boundary", async () => {
    const middleware = await loadMiddleware({
      knownCanonicalRoutePaths: ["/guides/a/b"],
      markdownCanonicalRoutePaths: ["/guides/a/b"],
    });
    const response = await middleware(
      request("/guides/a%2fb", { accept: "text/markdown" }),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("returns 406 when neither representation of a known page is acceptable", async () => {
    const middleware = await loadMiddleware();
    const response = await middleware(
      request("/guide", {
        accept: "text/html;q=0, text/markdown;q=0",
      }),
    );

    expect(response.status).toBe(406);
    expect(response.headers.get("Vary")).toBe("Accept, Accept-Encoding");
    expect(response.headers.get("Link")).toBe(
      '</guide.md>; rel="alternate"; type="text/markdown"',
    );
    expect(await response.text()).toBe("Not Acceptable");
  });

  it("returns a Markdown recovery document for unknown extensionless paths", async () => {
    const middleware = await loadMiddleware({ basePath: "/docs" });
    const response = await middleware(
      request("/docs/not/a-page", { accept: "text/markdown" }),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("Vary")).toBe("Accept, Accept-Encoding");
    expect(response.headers.get("x-middleware-next")).toBeNull();
    expect(await response.text()).toBe(
      "# Page not found\n\n- [Documentation home](/docs)\n",
    );
  });

  it.each(["/docs/not-a-page.md", "/docs/not-a-page.mdx"])(
    "returns a Markdown recovery document for missing explicit path %s",
    async (pathname) => {
      const middleware = await loadMiddleware({ basePath: "/docs" });
      const response = await middleware(request(pathname));

      expect(response.status).toBe(404);
      expect(response.headers.get("Content-Type")).toBe(
        "text/markdown; charset=utf-8",
      );
      expect(response.headers.get("Vary")).toBeNull();
      expect(await response.text()).toBe(
        "# Page not found\n\n- [Documentation home](/docs)\n",
      );
    },
  );

  it("varies pass-through HTML 404s on Accept", async () => {
    const middleware = await loadMiddleware({ basePath: "/docs" });

    for (const accept of [undefined, "text/html"]) {
      const response = await middleware(
        request("/docs/not/a-page", { accept }),
      );
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("Vary")).toBe("Accept, Accept-Encoding");
    }
  });

  it.each(["application/json", "text/html;q=0, text/markdown;q=0"])(
    "returns 406 for an unknown path when %j is unacceptable",
    async (accept) => {
      const middleware = await loadMiddleware({ basePath: "/docs" });
      const response = await middleware(
        request("/docs/not/a-page", { accept }),
      );

      expect(response.status).toBe(406);
      expect(response.headers.get("Vary")).toBe("Accept, Accept-Encoding");
      expect(await response.text()).toBe("Not Acceptable");
    },
  );

  it("returns no response body for custom HEAD responses", async () => {
    const middleware = await loadMiddleware({ basePath: "/docs" });
    const notFound = await middleware(
      request("/docs/missing", { accept: "text/markdown", method: "HEAD" }),
    );
    const explicitNotFound = await middleware(
      request("/docs/missing.md", { method: "HEAD" }),
    );
    const notAcceptable = await middleware(
      request("/docs/guide", {
        accept: "text/html;q=0, text/markdown;q=0",
        method: "HEAD",
      }),
    );

    expect(notFound.status).toBe(404);
    expect(await notFound.text()).toBe("");
    expect(explicitNotFound.status).toBe(404);
    expect(await explicitNotFound.text()).toBe("");
    expect(notAcceptable.status).toBe(406);
    expect(await notAcceptable.text()).toBe("");
  });

  it("leaves non-document requests and non-Markdown routes alone", async () => {
    const middleware = await loadMiddleware({ basePath: "/docs" });

    for (const currentRequest of [
      request("/outside", { accept: "text/markdown" }),
      request("/docs/app.js", { accept: "text/markdown" }),
      request("/docs/custom", { accept: "text/markdown" }),
      request("/docs/guide", { accept: "text/markdown", method: "POST" }),
    ]) {
      const response = await middleware(currentRequest);
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("Vary")).toBeNull();
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    }
  });

  it("passes extensionless and Markdown static files through", async () => {
    const middleware = await loadMiddleware({
      basePath: "/docs",
      passthroughPaths: ["/docs/health", "/docs/source.md"],
    });

    for (const pathname of ["/docs/health", "/docs/source.md"]) {
      const response = await middleware(
        request(pathname, { accept: "text/markdown" }),
      );
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("Vary")).toBeNull();
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    }
  });

  it("rejects Markdown routes that are not known canonical routes", () => {
    expect(() =>
      generateVercelMarkdownMiddleware({
        knownCanonicalRoutePaths: ["/"],
        markdownCanonicalRoutePaths: ["/missing"],
        markdownNotFoundBody: "# Missing",
      }),
    ).toThrowError(
      'Markdown route "/missing" is not present in knownCanonicalRoutePaths',
    );
  });
});
