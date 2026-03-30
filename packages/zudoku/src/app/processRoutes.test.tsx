import type { RouteObject } from "react-router";
import { describe, expect, it, vi } from "vitest";

/**
 * @vitest-environment happy-dom
 */

vi.mock("../lib/components/Layout.js", () => ({
  Layout: () => <div data-testid="layout" />,
}));

const { processRoutes } = await import("./processRoutes.js");

describe("processRoutes", () => {
  it("Can enable layout on child level", () => {
    const routes: RouteObject[] = [
      {
        handle: { layout: "none" },
        children: [
          {
            path: "/without",
            element: "Without layout",
          },
          {
            path: "/with",
            handle: { layout: "default" },
            element: "With layout",
          },
        ],
      },
    ];

    const result = processRoutes(routes);

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "element": "Without layout",
              "path": "/without",
            },
            {
              "children": [
                {
                  "element": "With layout",
                  "handle": {
                    "layout": "default",
                  },
                  "path": "/with",
                },
              ],
              "element": <Layout />,
            },
          ],
          "handle": {
            "layout": "none",
          },
        },
      ]
    `);
  });

  it("Should wrap parent with layout if layout is not disabled", () => {
    const routes: RouteObject[] = [
      {
        element: "Parent with layout",
        children: [
          {
            path: "/without",
            element: "Without layout",
          },
          {
            path: "/with",
            handle: { layout: "default" },
            element: "With layout",
          },
        ],
      },
    ];

    expect(processRoutes(routes)).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "children": [
                {
                  "element": "Without layout",
                  "path": "/without",
                },
                {
                  "element": "With layout",
                  "handle": {
                    "layout": "default",
                  },
                  "path": "/with",
                },
              ],
              "element": "Parent with layout",
            },
          ],
          "element": <Layout />,
        },
      ]
    `);
  });

  it("handles deeply nested routes with mixed layout settings", () => {
    const routes: RouteObject[] = [
      {
        handle: { layout: "none" },
        children: [
          {
            path: "/level1",
            children: [
              {
                path: "/level1/level2",
                handle: { layout: "default" },
                element: "Deep with layout",
              },
              {
                path: "/level1/level2-no",
                element: "Deep without layout",
              },
            ],
          },
        ],
      },
    ];

    const result = processRoutes(routes);
    const level1 = result[0]?.children?.[0];
    const level2WithLayout = level1?.children?.[0];
    const level2Without = level1?.children?.[1];

    // The "default" child should be wrapped with Layout
    expect(level2WithLayout?.element).toMatchInlineSnapshot(`<Layout />`);
    expect(level2WithLayout?.children?.[0]?.path).toBe("/level1/level2");

    // The one without layout handle should remain unwrapped
    expect(level2Without?.path).toBe("/level1/level2-no");
    expect(level2Without?.element).toBe("Deep without layout");
  });

  it("returns leaf routes without children unchanged", () => {
    const routes: RouteObject[] = [{ path: "/leaf", element: "Leaf" }];

    const result = processRoutes(routes);
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "element": "Leaf",
              "path": "/leaf",
            },
          ],
          "element": <Layout />,
        },
      ]
    `);
  });

  it("handles empty children array", () => {
    const routes: RouteObject[] = [
      { path: "/parent", element: "Parent", children: [] },
    ];

    const result = processRoutes(routes);
    expect(result[0]?.children?.[0]?.children).toEqual([]);
  });
});
