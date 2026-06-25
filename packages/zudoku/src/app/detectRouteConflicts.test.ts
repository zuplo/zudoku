import type { RouteObject } from "react-router";
import { describe, expect, it } from "vitest";
import { detectRouteConflicts } from "./detectRouteConflicts.js";

describe("detectRouteConflicts", () => {
  it("returns no conflicts for disjoint plugin routes", () => {
    const a: RouteObject[] = [{ path: "/docs" }];
    const b: RouteObject[] = [{ path: "/api" }];

    expect(detectRouteConflicts([a, b])).toEqual([]);
  });

  it("detects the same path registered by two plugins", () => {
    const a: RouteObject[] = [{ path: "/docs", element: null }];
    const b: RouteObject[] = [{ path: "/docs", element: null }];

    expect(detectRouteConflicts([a, b])).toEqual(["/docs"]);
  });

  it("normalizes trailing slashes before comparing", () => {
    const a: RouteObject[] = [{ path: "/docs/" }];
    const b: RouteObject[] = [{ path: "/docs" }];

    expect(detectRouteConflicts([a, b])).toEqual(["/docs"]);
  });

  it("does not flag a path repeated within a single plugin", () => {
    // A plugin legitimately repeats a path across a parent and its children.
    const plugin: RouteObject[] = [
      {
        path: "/api",
        children: [{ index: true, path: "/api" }, { path: "/api/tags" }],
      },
    ];

    expect(detectRouteConflicts([plugin])).toEqual([]);
  });

  it("joins relative child paths with their parent", () => {
    const a: RouteObject[] = [
      { path: "/section", children: [{ path: "page" }] },
    ];
    const b: RouteObject[] = [{ path: "/section/page" }];

    expect(detectRouteConflicts([a, b])).toEqual(["/section/page"]);
  });

  it("keeps absolute child paths absolute", () => {
    // Mirrors the OpenAPI plugin, whose children repeat the full parent path.
    const a: RouteObject[] = [
      { path: "/api", children: [{ path: "/api/tags" }] },
    ];
    const b: RouteObject[] = [{ path: "/api/tags" }];

    expect(detectRouteConflicts([a, b])).toEqual(["/api/tags"]);
  });

  it("reports every conflicting path sorted", () => {
    const a: RouteObject[] = [{ path: "/b" }, { path: "/a" }];
    const b: RouteObject[] = [{ path: "/a" }, { path: "/b" }];

    expect(detectRouteConflicts([a, b])).toEqual(["/a", "/b"]);
  });

  it("ignores pathless layout routes", () => {
    const a: RouteObject[] = [{ children: [{ path: "/docs" }] }];
    const b: RouteObject[] = [{ children: [{ path: "/api" }] }];

    expect(detectRouteConflicts([a, b])).toEqual([]);
  });

  it("detects a top-level index route conflicting with an explicit root path", () => {
    // An index route with no path matches the root "/".
    const a: RouteObject[] = [{ index: true, element: null }];
    const b: RouteObject[] = [{ path: "/", element: null }];

    expect(detectRouteConflicts([a, b])).toEqual(["/"]);
  });

  it("detects a nested index route conflicting with its parent path", () => {
    // Mirrors the OpenAPI plugin's `{ index: true }` redirect under a version.
    const a: RouteObject[] = [
      { path: "/api", children: [{ index: true, element: null }] },
    ];
    const b: RouteObject[] = [{ path: "/api", element: null }];

    expect(detectRouteConflicts([a, b])).toEqual(["/api"]);
  });
});
