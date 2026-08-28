import { describe, expect, it, vi } from "vitest";
import type {
  BuildContributionContext,
  BuildContributions,
  ZudokuPlugin,
} from "../lib/core/plugins.js";
import {
  collectBuildContributions,
  createBuildArtifactDevMiddleware,
} from "./build-artifacts.js";

const context: BuildContributionContext = {
  basePath: "/docs",
  canonicalOrigin: "https://developers.example.com",
  apis: [],
};

const plugin = (contributions: BuildContributions): ZudokuPlugin => ({
  getBuildContributions: () => contributions,
});

describe("build artifact contributions", () => {
  it("loads a server-only contribution module after config evaluation", async () => {
    const moduleUrl = `data:text/javascript,${encodeURIComponent(
      "export default (context) => ({ warnings: [context.basePath] });",
    )}`;
    const contributions = await collectBuildContributions(
      [{ buildContributionsModule: moduleUrl }],
      context,
    );

    expect(contributions.warnings).toEqual(["/docs"]);
  });

  it.each([
    "/.",
    "/../secret",
    "/%2e%2e/secret",
    "/%252e%252e/secret",
    "/safe%2fsecret",
    "/safe%5csecret",
    "/safe%0asecret",
    "/safe\u0000secret",
    "/trailing/",
  ])("rejects unsafe artifact path %s", async (urlPath) => {
    await expect(
      collectBuildContributions(
        [plugin({ artifacts: [{ urlPath, content: "unsafe" }] })],
        context,
      ),
    ).rejects.toThrow("Unsafe build artifact URL path");
  });

  it("rejects trailing-slash aliases before they can collide with file paths", async () => {
    await expect(
      collectBuildContributions(
        [
          plugin({
            artifacts: [
              { urlPath: "/foo", content: "one" },
              { urlPath: "/foo/", content: "two" },
            ],
          }),
        ],
        context,
      ),
    ).rejects.toThrow("Unsafe build artifact URL path: /foo/");
  });

  it("rejects an alias whose destination is not contributed", async () => {
    await expect(
      collectBuildContributions(
        [
          plugin({
            aliases: [
              {
                sourcePath: "/.well-known/ard.json",
                destinationPath: "/missing/ard.json",
              },
            ],
          }),
        ],
        context,
      ),
    ).rejects.toThrow("is not a contributed artifact");
  });

  it("serves exact aliases with GET and HEAD parity", () => {
    const contributions: Required<BuildContributions> = {
      artifacts: [
        {
          urlPath: "/docs/.well-known/ard.json",
          content: '{"entries":[]}',
          contentType: "application/json; charset=utf-8",
          headers: { "Access-Control-Allow-Origin": "*" },
        },
      ],
      aliases: [
        {
          sourcePath: "/.well-known/ard.json",
          destinationPath: "/docs/.well-known/ard.json",
        },
      ],
      routeHeaders: [],
      llmsSections: [],
      warnings: [],
    };
    const middleware = createBuildArtifactDevMiddleware({
      getContributions: () => contributions,
    });

    for (const [method, expectedBody] of [
      ["GET", '{"entries":[]}'],
      ["HEAD", undefined],
    ] as const) {
      const headers = new Map<string, string>();
      const end = vi.fn();
      const next = vi.fn();
      middleware(
        { method, url: "/.well-known/ard.json" },
        {
          setHeader: (name, value) => headers.set(name, value),
          end,
        },
        next,
      );

      expect(headers).toEqual(
        new Map([
          ["Content-Type", "application/json; charset=utf-8"],
          ["Access-Control-Allow-Origin", "*"],
        ]),
      );
      expect(end).toHaveBeenCalledWith(expectedBody);
      expect(next).not.toHaveBeenCalled();
    }
  });

  it("serves extensionless catalog artifacts at scoped and root paths", () => {
    const contentType =
      'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"';
    const content = '{"linkset":[]}';
    const contributions: Required<BuildContributions> = {
      artifacts: [
        {
          urlPath: "/docs/.well-known/api-catalog",
          content,
          contentType,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=60",
            Link: '</.well-known/api-catalog>; rel="api-catalog"',
          },
        },
      ],
      aliases: [
        {
          sourcePath: "/.well-known/api-catalog",
          destinationPath: "/docs/.well-known/api-catalog",
        },
      ],
      routeHeaders: [],
      llmsSections: [],
      warnings: [],
    };
    const middleware = createBuildArtifactDevMiddleware({
      getContributions: () => contributions,
    });

    for (const pathname of [
      "/docs/.well-known/api-catalog",
      "/.well-known/api-catalog",
    ]) {
      for (const method of ["GET", "HEAD"] as const) {
        const headers = new Map<string, string>();
        const end = vi.fn();
        middleware(
          { method, url: pathname },
          {
            setHeader: (name, value) => headers.set(name, value),
            end,
          },
          vi.fn(),
        );
        expect(headers.get("Content-Type")).toBe(contentType);
        expect(headers.get("Access-Control-Allow-Origin")).toBe("*");
        expect(headers.get("Cache-Control")).toBe("public, max-age=60");
        expect(headers.get("Link")).toContain('rel="api-catalog"');
        expect(end).toHaveBeenCalledWith(
          method === "GET" ? content : undefined,
        );
      }
    }
  });
});
