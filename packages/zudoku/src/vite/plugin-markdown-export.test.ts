import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { validateConfig } from "../config/validators/ZudokuConfig.js";
import { getMarkdownPathname } from "../lib/util/markdown.js";
import {
  createMarkdownDevMiddleware,
  getMarkdownOutputPath,
  resolveMarkdownRoutePath,
  writeMarkdownInfo,
} from "./plugin-markdown-export.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((temporaryDirectory) =>
        rm(temporaryDirectory, { recursive: true, force: true }),
      ),
  );
});

const createMarkdownFixture = async () => {
  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "zudoku-markdown-middleware-"),
  );
  temporaryDirectories.push(temporaryDirectory);
  const filePath = path.join(temporaryDirectory, "guide.md");
  await writeFile(
    filePath,
    "---\ntitle: Agent Guide\n---\n\nUse the API safely.\n",
    "utf-8",
  );
  return filePath;
};

const createResponse = (initialHeaders: Record<string, string> = {}) => {
  const headers = new Map(
    Object.entries(initialHeaders).map(([name, value]) => [
      name.toLowerCase(),
      value,
    ]),
  );
  let body: string | undefined;

  return {
    response: {
      statusCode: 200,
      getHeader: (name: string) => headers.get(name.toLowerCase()),
      setHeader: (name: string, value: string) => {
        headers.set(name.toLowerCase(), value);
      },
      end: (value?: string) => {
        body = value;
      },
    },
    getBody: () => body,
    getHeader: (name: string) => headers.get(name.toLowerCase()),
  };
};

const createMiddleware = async (contentNegotiation = true) => {
  const filePath = await createMarkdownFixture();
  const config = validateConfig({
    basePath: "/docs",
    docs: { publishMarkdown: true, contentNegotiation },
  });

  return createMarkdownDevMiddleware({
    config,
    getMarkdownFiles: () => ({ "/guide": filePath }),
  });
};

describe("createMarkdownDevMiddleware", () => {
  it("serves negotiated Markdown from a canonical documentation URL", async () => {
    const middleware = await createMiddleware();
    const { response, getBody, getHeader } = createResponse();
    const next = vi.fn();

    await middleware(
      {
        method: "GET",
        url: "/docs/guide?source=agent",
        headers: { accept: "text/markdown" },
      },
      response,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
    expect(getHeader("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(getHeader("Vary")).toBe("Accept");
    expect(getHeader("Link")).toBe(
      '</docs/guide.md>; rel="alternate"; type="text/markdown"',
    );
    expect(getBody()).toBe("# Agent Guide\n\nUse the API safely.\n");
  });

  it("advertises variants for HTML and returns no body for Markdown HEAD", async () => {
    const middleware = await createMiddleware();
    const htmlResponse = createResponse({
      Link: '</assets/app.js>; rel="preload"',
      Vary: "Accept-Encoding",
    });
    const htmlNext = vi.fn();

    await middleware(
      {
        method: "GET",
        url: "/docs/guide",
        headers: { accept: "text/html" },
      },
      htmlResponse.response,
      htmlNext,
    );

    expect(htmlNext).toHaveBeenCalledOnce();
    expect(htmlResponse.getHeader("Vary")).toBe("Accept-Encoding, Accept");
    expect(htmlResponse.getHeader("Link")).toBe(
      '</assets/app.js>; rel="preload", </docs/guide.md>; rel="alternate"; type="text/markdown"',
    );

    const headResponse = createResponse();
    const headNext = vi.fn();
    await middleware(
      {
        method: "HEAD",
        url: "/docs/guide",
        headers: { accept: "text/markdown" },
      },
      headResponse.response,
      headNext,
    );

    expect(headNext).not.toHaveBeenCalled();
    expect(headResponse.getHeader("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(headResponse.getBody()).toBeUndefined();
  });

  it("returns 406 when neither available representation is acceptable", async () => {
    const middleware = await createMiddleware();
    const { response, getBody, getHeader } = createResponse();
    const next = vi.fn();

    await middleware(
      {
        method: "GET",
        url: "/docs/guide",
        headers: { accept: "application/json" },
      },
      response,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(406);
    expect(getHeader("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(getHeader("Vary")).toBe("Accept");
    expect(getBody()).toBe("Not Acceptable");

    const headResponse = createResponse();
    await middleware(
      {
        method: "HEAD",
        url: "/docs/guide",
        headers: { accept: "application/json" },
      },
      headResponse.response,
      vi.fn(),
    );
    expect(headResponse.response.statusCode).toBe(406);
    expect(headResponse.getBody()).toBeUndefined();
  });

  it("keeps explicit Markdown portable when negotiation is disabled", async () => {
    const middleware = await createMiddleware(false);
    const canonicalResponse = createResponse();
    const canonicalNext = vi.fn();

    await middleware(
      {
        method: "GET",
        url: "/docs/guide",
        headers: { accept: "text/markdown" },
      },
      canonicalResponse.response,
      canonicalNext,
    );

    expect(canonicalNext).toHaveBeenCalledOnce();
    expect(canonicalResponse.getHeader("Vary")).toBeUndefined();

    const explicitResponse = createResponse();
    const explicitNext = vi.fn();
    await middleware(
      {
        method: "GET",
        url: "/docs/guide.md",
        headers: { accept: "text/html" },
      },
      explicitResponse.response,
      explicitNext,
    );

    expect(explicitNext).not.toHaveBeenCalled();
    expect(explicitResponse.getHeader("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(explicitResponse.getBody()).toContain("# Agent Guide");
  });

  it("does not serve Markdown routes outside the configured base path", async () => {
    const middleware = await createMiddleware();
    const { response } = createResponse();
    const next = vi.fn();

    await middleware(
      {
        method: "GET",
        url: "/guide.md",
        headers: { accept: "text/markdown" },
      },
      response,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it("passes unknown canonical routes through without mutating headers", async () => {
    const middleware = await createMiddleware();
    const { response, getHeader } = createResponse();
    const next = vi.fn();

    await middleware(
      {
        method: "GET",
        url: "/docs/missing",
        headers: { accept: "text/markdown" },
      },
      response,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(getHeader("Vary")).toBeUndefined();
    expect(getHeader("Link")).toBeUndefined();
  });
});

describe("getMarkdownOutputPath", () => {
  it("maps root route to index.md", () => {
    expect(getMarkdownOutputPath("/dist", "/")).toBe(
      `${path.join("/dist", "index")}.md`,
    );
  });

  it("maps simple route to corresponding .md file", () => {
    expect(getMarkdownOutputPath("/dist", "/documentation")).toBe(
      `${path.join("/dist", "documentation")}.md`,
    );
  });

  it("maps nested route to corresponding .md file", () => {
    expect(getMarkdownOutputPath("/dist", "/docs/getting-started")).toBe(
      `${path.join("/dist", "docs", "getting-started")}.md`,
    );
  });
});

describe("writeMarkdownInfo", () => {
  it("overwrites stale route metadata when the current build has no Markdown files", async () => {
    const tempDir = await mkdtemp(
      path.join(os.tmpdir(), "zudoku-markdown-info-"),
    );
    const metadataPath = path.join(tempDir, ".zudoku/markdown-info.json");

    try {
      await writeMarkdownInfo(metadataPath, [
        {
          filePath: "/old.md",
          routePath: "/old",
          content: "Old content",
        },
      ]);
      await writeMarkdownInfo(metadataPath, []);

      await expect(readFile(metadataPath, "utf-8")).resolves.toBe("[]");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("getMarkdownPathname", () => {
  it("converts root pathname to /index", () => {
    expect(getMarkdownPathname("/")).toBe("/index");
  });

  it("leaves non-root pathnames unchanged", () => {
    expect(getMarkdownPathname("/documentation")).toBe("/documentation");
    expect(getMarkdownPathname("/docs/guide")).toBe("/docs/guide");
  });
});

describe("resolveMarkdownRoutePath", () => {
  it("resolves /index.md back to root route /", () => {
    expect(resolveMarkdownRoutePath("/index.md", "/")).toBe("/");
  });

  it("resolves normal .md URLs to route paths", () => {
    expect(resolveMarkdownRoutePath("/documentation.md", "/")).toBe(
      "/documentation",
    );
  });

  it("resolves nested .md URLs to route paths", () => {
    expect(resolveMarkdownRoutePath("/docs/guide.md", "/")).toBe("/docs/guide");
  });

  it("strips basePath before resolving", () => {
    expect(resolveMarkdownRoutePath("/base/documentation.md", "/base")).toBe(
      "/documentation",
    );
    expect(resolveMarkdownRoutePath("/base/index.md", "/base")).toBe("/");
  });

  it("rejects Markdown URLs outside the configured base path", () => {
    expect(resolveMarkdownRoutePath("/outside.md", "/base")).toBeUndefined();
  });

  it("handles .mdx extension", () => {
    expect(resolveMarkdownRoutePath("/documentation.mdx", "/")).toBe(
      "/documentation",
    );
  });

  it("strips query string before resolving", () => {
    expect(resolveMarkdownRoutePath("/index.md?t=123", "/")).toBe("/");
    expect(resolveMarkdownRoutePath("/documentation.md?v=abc", "/")).toBe(
      "/documentation",
    );
  });

  it("strips hash before resolving", () => {
    expect(resolveMarkdownRoutePath("/documentation.md#section", "/")).toBe(
      "/documentation",
    );
  });
});

describe("roundtrip: getMarkdownPathname → resolveMarkdownRoutePath", () => {
  const basePath = "/";

  it("roundtrips root path correctly", () => {
    const pathname = "/";
    const markdownUrl = `${getMarkdownPathname(pathname)}.md`;
    const resolved = resolveMarkdownRoutePath(markdownUrl, basePath);
    expect(resolved).toBe(pathname);
  });

  it("roundtrips normal path correctly", () => {
    const pathname = "/documentation";
    const markdownUrl = `${getMarkdownPathname(pathname)}.md`;
    const resolved = resolveMarkdownRoutePath(markdownUrl, basePath);
    expect(resolved).toBe(pathname);
  });

  it("roundtrips nested path correctly", () => {
    const pathname = "/docs/getting-started";
    const markdownUrl = `${getMarkdownPathname(pathname)}.md`;
    const resolved = resolveMarkdownRoutePath(markdownUrl, basePath);
    expect(resolved).toBe(pathname);
  });

  it("roundtrips path with custom route (issue #2269)", () => {
    // When file: "my-file" has path: "/", the browser pathname is "/"
    // The markdown URL should roundtrip back to "/" so the middleware
    // can find the file in the markdownFiles mapping
    const pathname = "/";
    const markdownUrl = `${getMarkdownPathname(pathname)}.md`;

    // URL should be /index.md, NOT /.md
    expect(markdownUrl).toBe("/index.md");

    const resolved = resolveMarkdownRoutePath(markdownUrl, basePath);
    expect(resolved).toBe("/");
  });
});
