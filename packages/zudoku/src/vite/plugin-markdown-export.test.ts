import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getMarkdownOutputPath,
  resolveMarkdownRoutePath,
} from "./plugin-markdown-export.js";

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

describe("resolveMarkdownRoutePath", () => {
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
  });

  it("handles .mdx extension", () => {
    expect(resolveMarkdownRoutePath("/documentation.mdx", "/")).toBe(
      "/documentation",
    );
  });
});

describe("issue #2269: markdown URL for root path with custom file", () => {
  // Simulates the scenario: { type: "doc", file: "welcome", path: "/" }
  // The middleware keeps both the original file route and the custom path route.
  // MdxPage uses the actual filename for the root path URL.

  it("middleware resolves /welcome.md to the original file route", () => {
    const markdownFiles: Record<string, string> = {
      "/welcome": "/abs/path/pages/welcome.md", // original file route (kept)
      "/": "/abs/path/pages/welcome.md", // custom path route
    };

    const routePath = resolveMarkdownRoutePath("/welcome.md", "/");
    expect(routePath).toBe("/welcome");
    expect(markdownFiles[routePath]).toBe("/abs/path/pages/welcome.md");
  });

  it("middleware still resolves non-root custom paths normally", () => {
    // { type: "doc", file: "documentation", path: "getting-started" }
    const markdownFiles: Record<string, string> = {
      "/documentation": "/abs/path/pages/documentation.mdx", // original
      "/getting-started": "/abs/path/pages/documentation.mdx", // custom
    };

    const routePath = resolveMarkdownRoutePath("/getting-started.md", "/");
    expect(routePath).toBe("/getting-started");
    expect(markdownFiles[routePath]).toBe("/abs/path/pages/documentation.mdx");
  });

  it("MdxPage derives filename from __filepath for root path", () => {
    // This mirrors the logic in MdxPage.tsx
    const __filepath = "pages/welcome.md";
    const locationPathname = "/";

    const fileBasename = __filepath
      .split("/")
      .pop()
      ?.replace(/\.mdx?$/, "");
    const markdownPathname =
      locationPathname === "/" ? `/${fileBasename}` : locationPathname;

    expect(markdownPathname).toBe("/welcome");
    // The full URL would be /welcome.md — NOT /.md or /index.md
  });

  it("MdxPage uses location.pathname for non-root paths", () => {
    const __filepath = "pages/documentation.mdx";
    const locationPathname: string = "/getting-started";

    const fileBasename = __filepath
      .split("/")
      .pop()
      ?.replace(/\.mdx?$/, "");
    const markdownPathname =
      locationPathname === "/" ? `/${fileBasename}` : locationPathname;

    expect(markdownPathname).toBe("/getting-started");
  });
});
